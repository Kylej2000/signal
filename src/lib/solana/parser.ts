/**
 * Transaction parser — the heart of "is this a BUY?".
 * -----------------------------------------------------------------------------
 * Given a Helius "enhanced" transaction and the set of tracked wallet
 * addresses, decide whether the tracked wallet SWAPPED a quote asset
 * (SOL / USDC / USDT) for an SPL token (a BUY) or vice-versa (a SELL).
 *
 * We deliberately compute NET balance changes for the wallet and require BOTH
 * sides of a swap to be present. A plain incoming token transfer (airdrop,
 * bridge, wallet-to-wallet) produces a token gain with NO corresponding quote
 * spend, so it is NOT classified as a buy. This distinction is the whole point.
 */

import { QUOTE_MINTS, isQuoteMint } from "@/lib/config";
import type { Chain } from "@/lib/types";

const WSOL_MINT = "So11111111111111111111111111111111111111112";
const LAMPORTS_PER_SOL = 1_000_000_000;
// Ignore SOL movements below this (fees, rent) when deciding a "spend".
const MIN_SOL_SPEND = 0.001;

export interface ParsedSwap {
  chain?: Chain;
  walletAddress: string;
  signature: string;
  type: "buy" | "sell";
  tokenMint: string;
  tokenAmount: number; // UI amount of the SPL token bought (buy) / sold (sell)
  quoteMint: string; // which quote asset was used
  quoteSymbol: string;
  quoteAmount: number; // UI amount of the quote asset spent (buy) / received (sell)
  solAmount: number | null; // SOL leg specifically, if any
  dex: string | null;
  blockTime: string; // ISO
  explorerUrl?: string;
}

interface HeliusTokenTransfer {
  fromUserAccount?: string;
  toUserAccount?: string;
  mint?: string;
  tokenAmount?: number;
}
interface HeliusNativeTransfer {
  fromUserAccount?: string;
  toUserAccount?: string;
  amount?: number; // lamports
}
export interface HeliusEnhancedTx {
  signature?: string;
  timestamp?: number; // unix seconds
  source?: string; // JUPITER / RAYDIUM / ...
  type?: string;
  feePayer?: string;
  tokenTransfers?: HeliusTokenTransfer[];
  nativeTransfers?: HeliusNativeTransfer[];
  events?: { swap?: unknown };
}

function dexLabel(source?: string): string | null {
  if (!source) return null;
  const map: Record<string, string> = {
    JUPITER: "Jupiter",
    RAYDIUM: "Raydium",
    ORCA: "Orca",
    PUMP_FUN: "Pump.fun",
    PUMP_AMM: "Pump.fun",
    METEORA: "Meteora",
    PHOENIX: "Phoenix",
    LIFINITY: "Lifinity",
  };
  return map[source] ?? source.charAt(0) + source.slice(1).toLowerCase();
}

/**
 * Compute the wallet's net change per mint. SOL (native + wrapped) is keyed by
 * the WSOL mint. Returns a map mint -> net UI amount (positive = received).
 */
function netChanges(tx: HeliusEnhancedTx, wallet: string): Map<string, number> {
  const net = new Map<string, number>();
  const add = (mint: string, amount: number) => {
    net.set(mint, (net.get(mint) ?? 0) + amount);
  };

  for (const t of tx.tokenTransfers ?? []) {
    if (!t.mint || t.tokenAmount == null) continue;
    if (t.toUserAccount === wallet) add(t.mint, t.tokenAmount);
    if (t.fromUserAccount === wallet) add(t.mint, -t.tokenAmount);
  }
  for (const n of tx.nativeTransfers ?? []) {
    if (n.amount == null) continue;
    const sol = n.amount / LAMPORTS_PER_SOL;
    if (n.toUserAccount === wallet) add(WSOL_MINT, sol);
    if (n.fromUserAccount === wallet) add(WSOL_MINT, -sol);
  }
  return net;
}

/**
 * Parse a single enhanced transaction into at most one ParsedSwap for the given
 * tracked wallet. Returns null when it is not a quote<->token swap.
 */
export function parseSwapForWallet(
  tx: HeliusEnhancedTx,
  wallet: string,
): ParsedSwap | null {
  if (!tx.signature) return null;
  const net = netChanges(tx, wallet);
  if (net.size === 0) return null;

  // Split into quote-asset changes and non-quote token changes.
  const gains: [string, number][] = [];
  const losses: [string, number][] = [];
  for (const [mint, amt] of net) {
    if (Math.abs(amt) < 1e-9) continue;
    if (amt > 0) gains.push([mint, amt]);
    else losses.push([mint, amt]);
  }

  // A quote spend = a quote mint with a negative net beyond dust.
  const quoteSpend = losses.find(([mint, amt]) => {
    if (!isQuoteMint(mint)) return false;
    if (mint === WSOL_MINT) return Math.abs(amt) >= MIN_SOL_SPEND;
    return Math.abs(amt) > 0;
  });
  const quoteReceive = gains.find(([mint, amt]) => {
    if (!isQuoteMint(mint)) return false;
    if (mint === WSOL_MINT) return amt >= MIN_SOL_SPEND;
    return amt > 0;
  });

  // Dominant non-quote token gained / lost.
  const tokenGain = gains
    .filter(([mint]) => !isQuoteMint(mint))
    .sort((a, b) => b[1] - a[1])[0];
  const tokenLoss = losses
    .filter(([mint]) => !isQuoteMint(mint))
    .sort((a, b) => a[1] - b[1])[0];

  const blockTime = new Date((tx.timestamp ?? Math.floor(Date.now() / 1000)) * 1000).toISOString();
  const dex = dexLabel(tx.source);

  // BUY: spent a quote asset AND received a non-quote token.
  if (quoteSpend && tokenGain) {
    const [quoteMint, quoteAmtNeg] = quoteSpend;
    return {
      walletAddress: wallet,
      signature: tx.signature,
      type: "buy",
      tokenMint: tokenGain[0],
      tokenAmount: tokenGain[1],
      quoteMint,
      quoteSymbol: QUOTE_MINTS[quoteMint] ?? "?",
      quoteAmount: Math.abs(quoteAmtNeg),
      solAmount: quoteMint === WSOL_MINT ? Math.abs(quoteAmtNeg) : null,
      dex,
      blockTime,
    };
  }

  // SELL: sent a non-quote token AND received a quote asset.
  if (quoteReceive && tokenLoss) {
    const [quoteMint, quoteAmtPos] = quoteReceive;
    return {
      walletAddress: wallet,
      signature: tx.signature,
      type: "sell",
      tokenMint: tokenLoss[0],
      tokenAmount: Math.abs(tokenLoss[1]),
      quoteMint,
      quoteSymbol: QUOTE_MINTS[quoteMint] ?? "?",
      quoteAmount: quoteAmtPos,
      solAmount: quoteMint === WSOL_MINT ? quoteAmtPos : null,
      dex,
      blockTime,
    };
  }

  // Everything else (plain transfers, NFT mints, LP adds) is intentionally
  // ignored — it is NOT a buy.
  return null;
}

/**
 * Parse a webhook batch: for each tx, check every tracked wallet involved.
 */
export function parseWebhookBatch(
  txs: HeliusEnhancedTx[],
  trackedAddresses: Set<string>,
): ParsedSwap[] {
  const out: ParsedSwap[] = [];
  for (const tx of txs) {
    // Which tracked wallets are involved in this tx?
    const involved = new Set<string>();
    if (tx.feePayer && trackedAddresses.has(tx.feePayer)) involved.add(tx.feePayer);
    for (const t of tx.tokenTransfers ?? []) {
      if (t.fromUserAccount && trackedAddresses.has(t.fromUserAccount)) involved.add(t.fromUserAccount);
      if (t.toUserAccount && trackedAddresses.has(t.toUserAccount)) involved.add(t.toUserAccount);
    }
    for (const n of tx.nativeTransfers ?? []) {
      if (n.fromUserAccount && trackedAddresses.has(n.fromUserAccount)) involved.add(n.fromUserAccount);
      if (n.toUserAccount && trackedAddresses.has(n.toUserAccount)) involved.add(n.toUserAccount);
    }
    for (const wallet of involved) {
      const parsed = parseSwapForWallet(tx, wallet);
      if (parsed) out.push(parsed);
    }
  }
  return out;
}
