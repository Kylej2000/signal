import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { getAdminClient } from "@/lib/supabase/server";
import { xClient } from "@/lib/social/twitter";
import { processSocialPost } from "@/lib/signals/create";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Polls X for new posts from tracked influencers and ingests them.
 * Intended to be called by a scheduler (Vercel Cron / GitHub Action / QStash).
 *
 * Secured by TWITTER_CRON_SECRET via `?secret=` or the `x-cron-secret` header.
 */
async function handle(req: Request) {
  const { searchParams } = new URL(req.url);
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const provided =
    searchParams.get("secret") ?? req.headers.get("x-cron-secret") ?? bearer ?? null;
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`; set TWITTER_CRON_SECRET
  // to the same value (or CRON_SECRET) so scheduled calls authenticate.
  if (config.twitterCronSecret && provided !== config.twitterCronSecret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!xClient.isEnabled()) {
    return NextResponse.json({ ok: true, note: "X_BEARER_TOKEN not set; nothing polled." });
  }
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: true, note: "Supabase not configured; nothing stored." });
  }

  const { data: influencers } = await supabase
    .from("influencers")
    .select("id, x_handle")
    .eq("active", true)
    .not("x_handle", "is", null);

  let processed = 0;
  let created = 0;
  const perAccount: Record<string, number> = {};

  for (const inf of influencers ?? []) {
    const userId = await xClient.getUserId(inf.x_handle);
    if (!userId) continue;
    const posts = await xClient.getRecentPosts(userId);
    for (const post of posts) {
      processed++;
      const r = await processSocialPost(supabase, inf.id, post);
      if (r.status === "created") created++;
    }
    perAccount[inf.x_handle] = posts.length;
  }

  return NextResponse.json({ ok: true, processed, created, perAccount });
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
