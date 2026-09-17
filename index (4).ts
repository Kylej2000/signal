/**
 * Token enrichment orchestrator.
 * -----------------------------------------------------------------------------
 * Produces token metadata + a best-effort SNAPSHOT of price / market cap /
 * liquidity AT the transaction time. Historical values are honestly labelled:
 *
 *   price_source =
 *     'birdeye_historical'  -> price is the on-chain price at block time
 *     'dexscreener_current' -> current value used as an estimate
 *     'estimate'            -> derived/estimated value
 */

import { getDexScreenerInfo } from "./dexscreener";
import { getBirdeyeHistoricalPrice, getBirdeyeOverview } from "./birdeye";

export interface EnrichedToken {
  contract_address: string;
  symbol: string | null;
  name: string | null;
  image_url: string | null;
  dexscreener_url: string | null;
  dex: string | null;

  // snapshot at transaction time (or best available)
  token_price: number | null;
  market_cap: number | null;
  liquidity: number | null;
  price_source: "birdeye_historical" | "dexscreener_current" | "estimate";
}

export async function enrichToken(
  mint: string,
  blockUnixSeconds?: number,
): Promise<EnrichedToken> {
  const [ds, be] = await Promise.all([
    getDexScreenerInfo(mint),
    getBirdeyeOverview(mint),
  ]);

  const symbol = ds?.symbol ?? be?.symbol ?? null;
  const name = ds?.name ?? be?.name ?? null;
  const currentPrice = ds?.priceUsd ?? be?.price ?? null;
  const currentMc = ds?.marketCap ?? ds?.fdv ?? be?.marketCap ?? null;
  const currentLiq = ds?.liquidityUsd ?? be?.liquidity ?? null;

  let price = currentPrice;
  let marketCap = currentMc;
  const liquidity = currentLiq;
  let priceSource: EnrichedToken["price_source"] = "dexscreener_current";

  // Try to snapshot price at block time via Birdeye.
  if (blockUnixSeconds) {
    const hist = await getBirdeyeHistoricalPrice(mint, blockUnixSeconds);
    if (hist && hist > 0) {
      price = hist;
      priceSource = "birdeye_historical";
      // Estimate historical market cap by scaling current mc by the price ratio.
      if (currentMc && currentPrice && currentPrice > 0) {
        marketCap = (hist / currentPrice) * currentMc;
      }
    }
  }

  return {
    contract_address: mint,
    symbol,
    name,
    image_url: ds?.imageUrl ?? null,
    dexscreener_url: ds?.pairUrl ?? `https://dexscreener.com/solana/${mint}`,
    dex: ds?.dex ?? null,
    token_price: price,
    market_cap: marketCap,
    liquidity,
    price_source: priceSource,
  };
}

/** USD value of a quote leg (SOL amount * SOL price, or stablecoin amount). */
export async function quoteUsdValue(
  quoteSymbol: string,
  quoteAmount: number,
): Promise<number | null> {
  if (quoteSymbol === "USDC" || quoteSymbol === "USDT") return quoteAmount;
  if (quoteSymbol === "SOL") {
    const solPrice = await getSolPrice();
    return solPrice ? quoteAmount * solPrice : null;
  }
  return null;
}

let solPriceCache: { price: number; at: number } | null = null;
export async function getSolPrice(): Promise<number | null> {
  if (solPriceCache && Date.now() - solPriceCache.at < 60_000) return solPriceCache.price;
  const info = await getDexScreenerInfo("So11111111111111111111111111111111111111112");
  if (info?.priceUsd) {
    solPriceCache = { price: info.priceUsd, at: Date.now() };
    return info.priceUsd;
  }
  return null;
}
