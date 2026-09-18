/**
 * DexScreener enrichment (no API key required).
 * https://docs.dexscreener.com/api/reference
 */

export interface DexPairInfo {
  symbol: string | null;
  name: string | null;
  imageUrl: string | null;
  priceUsd: number | null;
  marketCap: number | null;
  fdv: number | null;
  liquidityUsd: number | null;
  dex: string | null;
  pairUrl: string | null;
}

const BASE = "https://api.dexscreener.com/latest/dex/tokens";

function dexLabel(dexId?: string | null): string | null {
  if (!dexId) return null;
  const map: Record<string, string> = {
    raydium: "Raydium",
    orca: "Orca",
    meteora: "Meteora",
    jupiter: "Jupiter",
    pumpfun: "Pump.fun",
    phoenix: "Phoenix",
    lifinity: "Lifinity",
  };
  return map[dexId.toLowerCase()] ?? dexId;
}

/** Fetch the best (highest-liquidity Solana) pair for a token mint. */
export async function getDexScreenerInfo(mint: string, chainId?: string): Promise<DexPairInfo | null> {
  try {
    const res = await fetch(`${BASE}/${mint}`, {
      headers: { accept: "application/json" },
      // Enrichment can tolerate short caching.
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const pairs: any[] = (json?.pairs ?? []).filter(
      (p: any) => !chainId || p?.chainId === chainId,
    );
    if (!pairs.length) return null;

    // Pick the deepest-liquidity pair.
    pairs.sort((a, b) => (b?.liquidity?.usd ?? 0) - (a?.liquidity?.usd ?? 0));
    const p = pairs[0];

    return {
      symbol: p?.baseToken?.symbol ?? null,
      name: p?.baseToken?.name ?? null,
      imageUrl: p?.info?.imageUrl ?? null,
      priceUsd: numeric(p?.priceUsd),
      marketCap: numeric(p?.marketCap),
      fdv: numeric(p?.fdv),
      liquidityUsd: numeric(p?.liquidity?.usd),
      dex: dexLabel(p?.dexId),
      pairUrl: p?.url ?? `https://dexscreener.com/${chainId ?? "solana"}/${mint}`,
    };
  } catch {
    return null;
  }
}

function numeric(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}
