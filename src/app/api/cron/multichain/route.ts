import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { evmChain } from "@/lib/evm/chains";
import { recentEvmSwaps } from "@/lib/evm/rpc";
import { processParsedSwap, type WalletRecord } from "@/lib/signals/create";
import { getAdminClient } from "@/lib/supabase/server";
import type { Chain } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request) {
  const secret = config.multichainCronSecret;
  return Boolean(secret && (req.headers.get("authorization") === `Bearer ${secret}` || new URL(req.url).searchParams.get("secret") === secret));
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  const { data, error } = await supabase.from("wallets")
    .select("id, influencer_id, address, verification_status, chain")
    .eq("active", true).neq("chain", "solana");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const wallets = (data ?? []) as WalletRecord[];
  const summary = { wallets: wallets.length, swaps: 0, created: 0, duplicates: 0, errors: 0, skipped: 0 };
  const details: Array<Record<string, unknown>> = [];
  for (const wallet of wallets) {
    const chain = evmChain(wallet.chain as Chain);
    if (!chain) { summary.skipped++; details.push({ wallet: wallet.address, chain: wallet.chain, status: "skipped", detail: "RPC not configured" }); continue; }
    try {
      const swaps = await recentEvmSwaps(chain, wallet.address);
      summary.swaps += swaps.length;
      for (const swap of swaps) {
        const result = await processParsedSwap(supabase, swap, wallet);
        if (result.status === "created") summary.created++;
        else if (result.status === "duplicate") summary.duplicates++;
        else summary.errors++;
        details.push({ wallet: wallet.address, chain: wallet.chain, hash: swap.signature, ...result });
      }
    } catch (e) {
      summary.errors++; details.push({ wallet: wallet.address, chain: wallet.chain, status: "error", detail: (e as Error).message });
    }
  }
  return NextResponse.json({ ok: true, provider: "evm-json-rpc", summary, details });
}
