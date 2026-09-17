/**
 * Signal orchestration — turns parsed on-chain / social events into DB rows
 * and alerts. Everything here is idempotent and requires the Supabase admin
 * client (service role). In demo mode (no DB) these are not called.
 *
 * Vertical slice:
 *   parsed swap -> token upsert + enrichment -> transaction (idempotent)
 *                -> signal (idempotent) -> alert dispatch
 *
 * Social slice:
 *   post -> mention extraction/scoring -> match to prior wallet buy
 *        -> correlated signal -> alert dispatch
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParsedSwap } from "@/lib/solana/parser";
import { enrichToken, quoteUsdValue } from "@/lib/enrichment";
import { dispatchAlert } from "@/lib/alerts";
import { maskAddress, detectionLatencySeconds } from "@/lib/format";
import { siteUrl } from "@/lib/config";
import {
  extractRawMentions,
  resolveMentions,
  type TokenLite,
} from "@/lib/social/matcher";
import type { PublicPost } from "@/lib/social/twitter";

const CHAIN = "solana";

// ---------------------------------------------------------------------------
// Wallet buy / sell
// ---------------------------------------------------------------------------
export interface WalletRecord {
  id: string;
  influencer_id: string;
  address: string;
  verification_status: string;
}

export async function processParsedSwap(
  supabase: SupabaseClient,
  parsed: ParsedSwap,
  wallet: WalletRecord,
): Promise<{ status: "created" | "duplicate" | "error"; signalId?: string; detail?: string }> {
  try {
    // Enrich token first (so the token upsert has metadata) using block time
    // for a historical price snapshot where possible.
    const blockUnix = Math.floor(new Date(parsed.blockTime).getTime() / 1000);
    const enriched = await enrichToken(parsed.tokenMint, blockUnix);

    // Upsert token.
    const { data: tokenRow, error: tokenErr } = await supabase
      .from("tokens")
      .upsert(
        {
          chain: CHAIN,
          contract_address: parsed.tokenMint,
          symbol: enriched.symbol,
          name: enriched.name,
          image_url: enriched.image_url,
          dexscreener_url: enriched.dexscreener_url,
        },
        { onConflict: "contract_address,chain" },
      )
      .select("id")
      .single();
    if (tokenErr || !tokenRow) return { status: "error", detail: tokenErr?.message };

    // Idempotency: bail if this exact (signature, wallet, token) already stored.
    const { data: existingTx } = await supabase
      .from("transactions")
      .select("id")
      .eq("transaction_hash", parsed.signature)
      .eq("wallet_id", wallet.id)
      .eq("token_id", tokenRow.id)
      .maybeSingle();
    if (existingTx) return { status: "duplicate", detail: "transaction already ingested" };

    // USD value of the trade from the quote leg.
    const usd = await quoteUsdValue(parsed.quoteSymbol, parsed.quoteAmount);

    const detectedAt = new Date().toISOString();
    const { data: txRow, error: txErr } = await supabase
      .from("transactions")
      .insert({
        wallet_id: wallet.id,
        token_id: tokenRow.id,
        transaction_hash: parsed.signature,
        transaction_type: parsed.type,
        token_amount: parsed.tokenAmount,
        sol_amount: parsed.solAmount,
        usd_value: usd,
        token_price: enriched.token_price,
        market_cap: enriched.market_cap,
        liquidity: enriched.liquidity,
        price_source: enriched.price_source,
        dex: parsed.dex ?? enriched.dex,
        block_timestamp: parsed.blockTime,
        detected_at: detectedAt,
        raw: parsed as unknown as Record<string, unknown>,
      })
      .select("id")
      .single();
    if (txErr || !txRow) {
      // Unique violation => another concurrent delivery beat us. Treat as dup.
      if (txErr?.code === "23505") return { status: "duplicate", detail: "race — already ingested" };
      return { status: "error", detail: txErr?.message };
    }

    // Create signal (idempotent on transaction_id).
    const { data: sigRow, error: sigErr } = await supabase
      .from("signals")
      .upsert(
        {
          influencer_id: wallet.influencer_id,
          token_id: tokenRow.id,
          transaction_id: txRow.id,
          signal_type: parsed.type === "buy" ? "wallet_buy" : "wallet_sell",
        },
        { onConflict: "transaction_id" },
      )
      .select("id")
      .single();
    if (sigErr || !sigRow) return { status: "error", detail: sigErr?.message };

    // Dispatch alert.
    const attributed =
      wallet.verification_status === "verified" ||
      wallet.verification_status === "publicly_disclosed";
    await dispatchAlert(sigRow.id, {
      kind: parsed.type,
      influencerName: await influencerName(supabase, wallet.influencer_id),
      tokenSymbol: enriched.symbol,
      usdValue: usd,
      marketCap: enriched.market_cap,
      liquidity: enriched.liquidity,
      dex: parsed.dex ?? enriched.dex,
      chain: "Solana",
      walletMasked: attributed ? maskAddress(wallet.address) : null,
      detectionSeconds: detectionLatencySeconds(parsed.blockTime, detectedAt),
      txHash: parsed.signature,
      dexscreenerUrl: enriched.dexscreener_url,
      signalUrl: `${siteUrl()}/signal/${sigRow.id}`,
    });

    return { status: "created", signalId: sigRow.id };
  } catch (e) {
    return { status: "error", detail: (e as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Social post
// ---------------------------------------------------------------------------
export async function processSocialPost(
  supabase: SupabaseClient,
  influencerId: string,
  post: PublicPost,
): Promise<{ status: "created" | "duplicate" | "no_signal" | "error"; signalId?: string; detail?: string }> {
  try {
    // Idempotency on (platform, post_id).
    const { data: existingPost } = await supabase
      .from("social_posts")
      .select("id")
      .eq("platform", "x")
      .eq("post_id", post.post_id)
      .maybeSingle();
    if (existingPost) return { status: "duplicate", detail: "post already ingested" };

    const { data: postRow, error: postErr } = await supabase
      .from("social_posts")
      .insert({
        influencer_id: influencerId,
        platform: "x",
        post_id: post.post_id,
        post_url: post.url,
        content: post.content,
        posted_at: post.posted_at,
        detected_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (postErr || !postRow) {
      if (postErr?.code === "23505") return { status: "duplicate" };
      return { status: "error", detail: postErr?.message };
    }

    // Known tokens + mints recently bought by this influencer's wallets.
    const [{ data: tokens }, recentMints] = await Promise.all([
      supabase.from("tokens").select("id, symbol, contract_address"),
      recentlyBoughtMints(supabase, influencerId),
    ]);

    const raw = extractRawMentions(post.content);
    const resolved = resolveMentions(
      raw,
      (tokens ?? []) as TokenLite[],
      recentMints,
    );

    // Persist mentions.
    for (const m of resolved) {
      await supabase.from("social_token_mentions").upsert(
        {
          social_post_id: postRow.id,
          token_id: m.token_id,
          ticker: m.ticker,
          contract_address: m.contract_address,
          confidence: m.confidence,
          match_reason: m.match_reason,
        },
        { onConflict: "social_post_id,token_id,ticker" },
      );
    }

    // Only HIGH-confidence, token-resolved mentions become signals by default.
    const best = resolved.filter((m) => m.confidence === "high" && m.token_id)[0];
    if (!best || !best.token_id) return { status: "no_signal", detail: "no high-confidence token match" };

    // Look for a correlated prior wallet buy of the same token.
    const corr = await findCorrelatedBuy(supabase, influencerId, best.token_id, post.posted_at);

    const signalPayload: Record<string, unknown> = {
      influencer_id: influencerId,
      token_id: best.token_id,
      social_post_id: postRow.id,
      signal_type: corr ? "correlated" : "social_mention",
    };
    if (corr) {
      signalPayload.correlated_transaction_id = corr.transactionId;
      signalPayload.seconds_between = corr.secondsBetween;
    }

    const { data: sigRow, error: sigErr } = await supabase
      .from("signals")
      .upsert(signalPayload, { onConflict: "social_post_id" })
      .select("id")
      .single();
    if (sigErr || !sigRow) return { status: "error", detail: sigErr?.message };

    await dispatchAlert(sigRow.id, {
      kind: "social",
      influencerName: await influencerName(supabase, influencerId),
      tokenSymbol: best.ticker,
      postUrl: post.url,
      correlationSeconds: corr?.secondsBetween ?? null,
      originalBuyUrl: corr?.signalUrl ?? null,
      signalUrl: `${siteUrl()}/signal/${sigRow.id}`,
    });

    return { status: "created", signalId: sigRow.id };
  } catch (e) {
    return { status: "error", detail: (e as Error).message };
  }
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
async function influencerName(supabase: SupabaseClient, id: string): Promise<string> {
  const { data } = await supabase.from("influencers").select("name").eq("id", id).maybeSingle();
  return data?.name ?? "Tracked influencer";
}

async function recentlyBoughtMints(
  supabase: SupabaseClient,
  influencerId: string,
  hours = 24,
): Promise<Set<string>> {
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  const { data } = await supabase
    .from("feed_signals")
    .select("contract_address, transaction_type, block_timestamp")
    .eq("influencer_id", influencerId)
    .eq("transaction_type", "buy")
    .gte("block_timestamp", since);
  return new Set((data ?? []).map((r: any) => r.contract_address).filter(Boolean));
}

async function findCorrelatedBuy(
  supabase: SupabaseClient,
  influencerId: string,
  tokenId: string,
  postedAt: string,
  hours = 24,
): Promise<{ transactionId: string; secondsBetween: number; signalUrl: string } | null> {
  const since = new Date(new Date(postedAt).getTime() - hours * 3600 * 1000).toISOString();
  // Most recent buy of this token by this influencer BEFORE the post.
  const { data } = await supabase
    .from("transactions")
    .select("id, block_timestamp, wallets!inner(influencer_id), signals(id)")
    .eq("token_id", tokenId)
    .eq("transaction_type", "buy")
    .eq("wallets.influencer_id", influencerId)
    .lte("block_timestamp", postedAt)
    .gte("block_timestamp", since)
    .order("block_timestamp", { ascending: false })
    .limit(1);
  const row: any = (data ?? [])[0];
  if (!row) return null;
  const secondsBetween = Math.round(
    (new Date(postedAt).getTime() - new Date(row.block_timestamp).getTime()) / 1000,
  );
  const buySignalId = Array.isArray(row.signals) ? row.signals[0]?.id : undefined;
  return {
    transactionId: row.id,
    secondsBetween,
    signalUrl: buySignalId ? `${siteUrl()}/signal/${buySignalId}` : `${siteUrl()}/feed`,
  };
}
