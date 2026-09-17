import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { getAdminClient } from "@/lib/supabase/server";
import { parseRpcSwap, parsedTransaction, recentSignatures } from "@/lib/solana/rpc";
import { processParsedSwap, type WalletRecord } from "@/lib/signals/create";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  const secret = config.solanaCronSecret;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  const querySecret = new URL(req.url).searchParams.get("secret");
  return auth === `Bearer ${secret}` || querySecret === secret;
}

/** Free MVP poller: public Solana RPC -> existing signal pipeline. */
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const { data, error } = await supabase
    .from("wallets")
    .select("id, influencer_id, address, verification_status")
    .eq("active", true)
    .eq("chain", "solana");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const wallets = (data ?? []) as WalletRecord[];
  const summary = { wallets: wallets.length, checked: 0, swaps: 0, created: 0, duplicates: 0, errors: 0 };
  const details: Array<{ wallet: string; signature?: string; status: string; detail?: string }> = [];

  for (const wallet of wallets) {
    try {
      const signatures = (await recentSignatures(wallet.address)).filter((s) => !s.err).reverse();
      for (const sig of signatures) {
        summary.checked++;
        try {
          const tx = await parsedTransaction(sig.signature);
          if (!tx) continue;
          const swap = parseRpcSwap(tx, wallet.address);
          if (!swap) continue;
          summary.swaps++;
          const result = await processParsedSwap(supabase, swap, wallet);
          if (result.status === "created") summary.created++;
          else if (result.status === "duplicate") summary.duplicates++;
          else summary.errors++;
          details.push({ wallet: wallet.address, signature: sig.signature, status: result.status, detail: result.detail });
        } catch (e) {
          summary.errors++;
          details.push({ wallet: wallet.address, signature: sig.signature, status: "error", detail: (e as Error).message });
        }
      }
    } catch (e) {
      summary.errors++;
      details.push({ wallet: wallet.address, status: "error", detail: (e as Error).message });
    }
  }

  return NextResponse.json({ ok: true, provider: "solana-public-rpc", summary, details });
}
