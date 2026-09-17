import { NextResponse } from "next/server";
import { checkAdminAuth, slugify } from "@/lib/admin-auth";
import { getAdminClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/config";
import { demoInfluencers, demoWallets } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (isDemoMode()) {
    return NextResponse.json({
      demo: true,
      influencers: demoInfluencers.map((i) => ({
        id: i.id,
        name: i.name,
        slug: i.slug,
        x_handle: i.x_handle,
        followers: i.followers,
        active: i.active,
        wallets: demoWallets
          .filter((w) => w.influencer_id === i.id)
          .map((w) => ({
            id: w.id,
            address: w.address,
            chain: w.chain,
            verification_status: w.verification_status,
            active: w.active,
          })),
      })),
    });
  }

  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ demo: true, influencers: [] });

  const { data: influencers } = await supabase.from("influencers").select("*").order("name");
  const { data: wallets } = await supabase.from("wallets").select("*");
  const merged = (influencers ?? []).map((i: any) => ({
    ...i,
    wallets: (wallets ?? []).filter((w: any) => w.influencer_id === i.id),
  }));
  return NextResponse.json({ demo: false, influencers: merged });
}

export async function POST(req: Request) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (!body.name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  if (isDemoMode()) {
    return NextResponse.json({
      message: "Demo mode — influencer not persisted. Configure Supabase to save.",
      demo: true,
    });
  }

  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });

  const handle = (body.x_handle ?? "").replace(/^@/, "") || null;
  const { data, error } = await supabase
    .from("influencers")
    .insert({
      name: body.name,
      slug: slugify(body.name),
      x_handle: handle,
      profile_image: body.profile_image || null,
      followers: body.followers ?? null,
      description: body.description || null,
      category: body.category || body.description || null,
      active: true,
    })
    .select("id, slug")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ message: `Added ${body.name}.`, influencer: data });
}
