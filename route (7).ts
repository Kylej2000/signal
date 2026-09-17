import { NextResponse } from "next/server";
import { verifyHeliusRequest } from "@/lib/solana/helius";
import { parseWebhookBatch, type HeliusEnhancedTx } from "@/lib/solana/parser";
import { processParsedSwap, type WalletRecord } from "@/lib/signals/create";
import { getAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/helius
 * Receives Helius "enhanced" transaction webhooks for monitored wallets.
 * - Authenticates via the Authorization header (HELIUS_WEBHOOK_SECRET).
 * - Parses swaps, ignores plain transfers.
 * - Idempotently stores transactions + creates signals + dispatches alerts.
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (!verifyHeliusRequest(auth)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const txs: HeliusEnhancedTx[] = Array.isArray(body) ? body : [body as HeliusEnhancedTx];

  const supabase = getAdminClient();
  if (!supabase) {
    // No DB configured — acknowledge so Helius doesn't retry, but nothing stored.
    return NextResponse.json({
      ok: true,
      persisted: false,
      note: "Supabase service role not configured; webhook acknowledged but not stored.",
      received: txs.length,
    });
  }

  // Load active wallets to know which addresses we track + their records.
  const { data: wallets, error } = await supabase
    .from("wallets")
    .select("id, influencer_id, address, verification_status, active")
    .eq("active", true);
  if (error) {
    return NextResponse.json({ error: "wallet lookup failed" }, { status: 500 });
  }

  const walletByAddress = new Map<string, WalletRecord>();
  for (const w of wallets ?? []) {
    walletByAddress.set(w.address, {
      id: w.id,
      influencer_id: w.influencer_id,
      address: w.address,
      verification_status: w.verification_status,
    });
  }
  const tracked = new Set(walletByAddress.keys());

  const parsed = parseWebhookBatch(txs, tracked);

  const results: { signature: string; type: string; status: string }[] = [];
  for (const p of parsed) {
    const wallet = walletByAddress.get(p.walletAddress);
    if (!wallet) continue;
    const r = await processParsedSwap(supabase, p, wallet);
    results.push({ signature: p.signature, type: p.type, status: r.status });
  }

  return NextResponse.json({
    ok: true,
    persisted: true,
    received: txs.length,
    swaps_detected: parsed.length,
    created: results.filter((r) => r.status === "created").length,
    duplicates: results.filter((r) => r.status === "duplicate").length,
    results,
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST Helius enhanced webhooks here." });
}
