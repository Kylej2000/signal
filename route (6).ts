import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { getAdminClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/config";
import { syncHeliusWatchlist } from "@/lib/solana/helius";

export const dynamic = "force-dynamic";

const VALID_STATUS = new Set([
  "verified",
  "publicly_disclosed",
  "community_reported",
  "unverified",
]);

export async function POST(req: Request) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (!body.influencer_id || !body.address) {
    return NextResponse.json({ error: "influencer_id and address are required" }, { status: 400 });
  }
  const status = VALID_STATUS.has(body.verification_status)
    ? body.verification_status
    : "unverified";

  if (isDemoMode()) {
    return NextResponse.json({
      message: "Demo mode — wallet not persisted. Configure Supabase to save.",
      demo: true,
    });
  }

  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });

  const { error } = await supabase.from("wallets").insert({
    influencer_id: body.influencer_id,
    address: body.address.trim(),
    chain: body.chain || "solana",
    label: body.label || null,
    verification_status: status,
    verification_source: body.verification_source || null,
    verified_at:
      status === "verified" || status === "publicly_disclosed"
        ? new Date().toISOString()
        : null,
    active: body.active !== false,
  });
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "This address is already tracked." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Keep the Helius monitored-address list in sync with all active wallets.
  const { data: active } = await supabase
    .from("wallets")
    .select("address")
    .eq("active", true)
    .eq("chain", "solana");
  const sync = await syncHeliusWatchlist((active ?? []).map((w: any) => w.address));

  return NextResponse.json({
    message: `Wallet added.${sync.ok ? " " + sync.message : ""}`,
    helius: sync,
  });
}

/** PATCH: activate / deactivate a wallet, then re-sync Helius. */
export async function PATCH(req: Request) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (isDemoMode()) {
    return NextResponse.json({ message: "Demo mode — not persisted.", demo: true });
  }
  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });

  const { error } = await supabase
    .from("wallets")
    .update({ active: Boolean(body.active) })
    .eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: active } = await supabase
    .from("wallets")
    .select("address")
    .eq("active", true)
    .eq("chain", "solana");
  const sync = await syncHeliusWatchlist((active ?? []).map((w: any) => w.address));
  return NextResponse.json({ message: "Wallet updated.", helius: sync });
}
