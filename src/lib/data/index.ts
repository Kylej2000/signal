/**
 * Data access layer.
 * -----------------------------------------------------------------------------
 * Single source the UI reads from. In DEMO_MODE it returns the fictional demo
 * dataset. Otherwise it reads from Supabase (the `feed_signals` view + base
 * tables). Every function is async and never throws to the UI — on error it
 * falls back to demo so the app always renders.
 */

import { isDemoMode } from "@/lib/config";
import { getServerClient } from "@/lib/supabase/server";
import { maskAddress, verificationLabel } from "@/lib/format";
import type {
  FeedItem,
  Influencer,
  InfluencerDirectoryEntry,
  InfluencerStats,
  SignalType,
  Wallet,
} from "@/lib/types";
import {
  demoCorrelations,
  demoDirectory,
  demoFeed,
  demoFeedByInfluencer,
  demoFeedItemById,
  demoInfluencerBySlug,
  demoStats,
  demoWalletsForInfluencer,
} from "@/lib/demo-data";

export interface FeedQuery {
  types?: SignalType[];
  influencerSlug?: string;
  minUsd?: number;
  marketCapBucket?: "u100k" | "100k-500k" | "500k-1m" | "1m-10m" | "10m+";
  limit?: number;
}

// ---- helpers ---------------------------------------------------------------

function inMarketCapBucket(mc: number | null | undefined, bucket?: FeedQuery["marketCapBucket"]): boolean {
  if (!bucket) return true;
  if (mc === null || mc === undefined) return false;
  switch (bucket) {
    case "u100k":
      return mc < 100_000;
    case "100k-500k":
      return mc >= 100_000 && mc < 500_000;
    case "500k-1m":
      return mc >= 500_000 && mc < 1_000_000;
    case "1m-10m":
      return mc >= 1_000_000 && mc < 10_000_000;
    case "10m+":
      return mc >= 10_000_000;
  }
}

function applyFilters(items: FeedItem[], q: FeedQuery): FeedItem[] {
  let out = items;
  if (q.types && q.types.length) {
    out = out.filter((i) => q.types!.includes(i.signal_type));
  }
  if (q.influencerSlug) {
    out = out.filter((i) => i.influencer.slug === q.influencerSlug);
  }
  if (q.minUsd) {
    out = out.filter((i) => (i.transaction?.usd_value ?? 0) >= q.minUsd!);
  }
  if (q.marketCapBucket) {
    out = out.filter((i) => {
      const mc = i.transaction?.market_cap ?? i.correlation?.market_cap_at_purchase;
      return inMarketCapBucket(mc, q.marketCapBucket);
    });
  }
  if (q.limit) out = out.slice(0, q.limit);
  return out;
}

// Map a `feed_signals` view row -> FeedItem
function mapRow(row: any): FeedItem {
  const isVerified =
    row.wallet_verification_status === "verified" ||
    row.wallet_verification_status === "publicly_disclosed";

  return {
    id: row.id,
    signal_type: row.signal_type,
    created_at: row.created_at,
    seconds_between: row.seconds_between ?? null,
    influencer: {
      id: row.influencer_id,
      name: row.influencer_name,
      slug: row.influencer_slug,
      x_handle: row.x_handle ?? null,
      profile_image: row.profile_image ?? null,
    },
    token: row.token_id
      ? {
          id: row.token_id,
          symbol: row.token_symbol ?? null,
          name: row.token_name ?? null,
          contract_address: row.contract_address,
          image_url: row.token_image ?? null,
          dexscreener_url: row.dexscreener_url ?? null,
        }
      : null,
    transaction: row.transaction_id
      ? {
          id: row.transaction_id,
          transaction_hash: row.transaction_hash,
          transaction_type: row.transaction_type,
          usd_value: row.usd_value,
          token_amount: row.token_amount,
          sol_amount: row.sol_amount,
          market_cap: row.market_cap,
          liquidity: row.liquidity,
          token_price: row.token_price,
          dex: row.dex,
          block_timestamp: row.block_timestamp,
          detected_at: row.detected_at,
          price_source: row.price_source,
          // Only expose (masked) wallet addresses for attributed wallets.
          wallet_address_masked: isVerified ? maskAddress(row.wallet_address) : null,
        }
      : null,
    post: row.social_post_id
      ? {
          id: row.social_post_id,
          post_url: row.post_url,
          content: row.post_content,
          posted_at: row.posted_at,
        }
      : null,
    correlation:
      row.correlated_purchase_time && row.seconds_between != null
        ? {
            transaction_id: row.correlated_transaction_id ?? "",
            seconds_between: row.seconds_between,
            market_cap_at_purchase: row.correlated_market_cap ?? null,
            purchase_time: row.correlated_purchase_time,
          }
        : null,
    demo: false,
  };
}

// ---- public reads ----------------------------------------------------------

export async function getFeed(q: FeedQuery = {}): Promise<FeedItem[]> {
  if (isDemoMode()) return applyFilters(demoFeed(), q);
  const supabase = getServerClient();
  if (!supabase) return applyFilters(demoFeed(), q);
  try {
    const { data, error } = await supabase
      .from("feed_signals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(q.limit ?? 200);
    if (error || !data) return applyFilters(demoFeed(), q);
    return applyFilters(data.map(mapRow), q);
  } catch {
    return applyFilters(demoFeed(), q);
  }
}

export async function getFeedByInfluencer(slug: string, limit = 50): Promise<FeedItem[]> {
  if (isDemoMode()) return demoFeedByInfluencer(slug).slice(0, limit);
  const all = await getFeed({ influencerSlug: slug, limit });
  return all;
}

export async function getFeedItem(id: string): Promise<FeedItem | null> {
  if (isDemoMode()) return demoFeedItemById(id);
  const supabase = getServerClient();
  if (!supabase) return demoFeedItemById(id);
  try {
    const { data, error } = await supabase
      .from("feed_signals")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return mapRow(data);
  } catch {
    return null;
  }
}

export async function getDirectory(): Promise<InfluencerDirectoryEntry[]> {
  if (isDemoMode()) return demoDirectory();
  const supabase = getServerClient();
  if (!supabase) return demoDirectory();
  try {
    const { data: influencers, error } = await supabase
      .from("influencers")
      .select("*")
      .eq("active", true);
    if (error || !influencers) return demoDirectory();

    const { data: wallets } = await supabase.from("wallets").select("*").eq("active", true);
    const { data: lastActivity } = await supabase
      .from("feed_signals")
      .select("influencer_id, created_at")
      .order("created_at", { ascending: false });

    return (influencers as Influencer[]).map((inf) => {
      const w = (wallets ?? []).filter((x: any) => x.influencer_id === inf.id);
      const verified = w.filter(
        (x: any) =>
          x.verification_status === "verified" ||
          x.verification_status === "publicly_disclosed",
      );
      const la = (lastActivity ?? []).find((x: any) => x.influencer_id === inf.id);
      return {
        ...inf,
        wallet_count: w.length,
        verified_wallet_count: verified.length,
        primary_chain: "solana" as const,
        last_activity: la?.created_at ?? null,
      };
    });
  } catch {
    return demoDirectory();
  }
}

export async function getInfluencer(slug: string): Promise<Influencer | null> {
  if (isDemoMode()) return demoInfluencerBySlug(slug);
  const supabase = getServerClient();
  if (!supabase) return demoInfluencerBySlug(slug);
  try {
    const { data } = await supabase
      .from("influencers")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    return (data as Influencer) ?? null;
  } catch {
    return null;
  }
}

export interface WalletView extends Wallet {
  verification_display: string;
  address_masked: string;
  /** Full address only shown for attributed wallets. */
  address_public: string | null;
}

export async function getWalletsForInfluencer(influencerId: string): Promise<WalletView[]> {
  const decorate = (w: Wallet): WalletView => {
    const attributed =
      w.verification_status === "verified" ||
      w.verification_status === "publicly_disclosed";
    return {
      ...w,
      verification_display: verificationLabel(w.verification_status),
      address_masked: maskAddress(w.address),
      address_public: attributed ? w.address : null,
    };
  };

  if (isDemoMode()) return demoWalletsForInfluencer(influencerId).map(decorate);
  const supabase = getServerClient();
  if (!supabase) return demoWalletsForInfluencer(influencerId).map(decorate);
  try {
    const { data } = await supabase
      .from("wallets")
      .select("*")
      .eq("influencer_id", influencerId)
      .eq("active", true);
    return ((data as Wallet[]) ?? []).map(decorate);
  } catch {
    return [];
  }
}

export async function getStats(influencerId: string): Promise<InfluencerStats> {
  if (isDemoMode()) return demoStats(influencerId);
  const supabase = getServerClient();
  if (!supabase) return demoStats(influencerId);
  try {
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const { data } = await supabase
      .from("feed_signals")
      .select("*")
      .eq("influencer_id", influencerId)
      .gte("created_at", since);
    const rows = (data ?? []) as any[];
    const buys = rows.filter((r) => r.signal_type === "wallet_buy");
    const sells = rows.filter((r) => r.signal_type === "wallet_sell");
    const mentions = rows.filter(
      (r) => r.signal_type === "social_mention" || r.signal_type === "correlated",
    );
    const buyUsd = buys.map((b) => Number(b.usd_value) || 0).filter((n) => n > 0);
    const avg = buyUsd.length ? buyUsd.reduce((a, b) => a + b, 0) / buyUsd.length : null;
    const tokens = new Set(buys.map((b) => b.token_id).filter(Boolean));
    return {
      buys_30d: buys.length,
      sells_30d: sells.length,
      tokens_bought: tokens.size,
      average_purchase_usd: avg,
      social_mentions_30d: mentions.length,
    };
  } catch {
    return demoStats(influencerId);
  }
}

export async function getCorrelations(influencerId: string): Promise<FeedItem[]> {
  if (isDemoMode()) return demoCorrelations(influencerId);
  const all = await getFeed({ types: ["correlated"], limit: 100 });
  return all.filter((f) => f.influencer.id === influencerId);
}
