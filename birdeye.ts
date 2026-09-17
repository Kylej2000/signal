/**
 * Birdeye enrichment (optional — improves HISTORICAL price snapshots).
 * https://docs.birdeye.so
 *
 * Requires BIRDEYE_API_KEY. Returns null when unavailable so callers fall back
 * to DexScreener current values (clearly labelled as estimates).
 */

import { config, hasBirdeye } from "@/lib/config";

const BASE = "https://public-api.birdeye.so";

function headers() {
  return {
    "X-API-KEY": config.birdeyeApiKey as string,
    "x-chain": "solana",
    accept: "application/json",
  };
}

/** Current price + market data for a token. */
export async function getBirdeyeOverview(mint: string): Promise<{
  price: number | null;
  marketCap: number | null;
  liquidity: number | null;
  symbol: string | null;
  name: string | null;
} | null> {
  if (!hasBirdeye()) return null;
  try {
    const res = await fetch(`${BASE}/defi/token_overview?address=${mint}`, {
      headers: headers(),
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const d = json?.data;
    if (!d) return null;
    return {
      price: num(d.price),
      marketCap: num(d.marketCap ?? d.mc),
      liquidity: num(d.liquidity),
      symbol: d.symbol ?? null,
      name: d.name ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Historical USD price of a token at (or nearest to) a unix timestamp.
 * Uses the 1-minute history window around the target time.
 */
export async function getBirdeyeHistoricalPrice(
  mint: string,
  unixSeconds: number,
): Promise<number | null> {
  if (!hasBirdeye()) return null;
  try {
    const from = unixSeconds - 120;
    const to = unixSeconds + 120;
    const url = `${BASE}/defi/history_price?address=${mint}&address_type=token&type=1m&time_from=${from}&time_to=${to}`;
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const items: any[] = json?.data?.items ?? [];
    if (!items.length) return null;
    // closest by unixTime
    items.sort(
      (a, b) => Math.abs(a.unixTime - unixSeconds) - Math.abs(b.unixTime - unixSeconds),
    );
    return num(items[0]?.value);
  } catch {
    return null;
  }
}

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}
