import { QUOTE_MINTS, config, isQuoteMint } from "@/lib/config";
import type { ParsedSwap } from "@/lib/solana/parser";

const WSOL_MINT = "So11111111111111111111111111111111111111112";
const LAMPORTS_PER_SOL = 1_000_000_000;
const MIN_SOL_MOVEMENT = 0.001;

type JsonRpcResponse<T> = { result?: T; error?: { message?: string } };

interface SignatureInfo {
  signature: string;
  blockTime: number | null;
  err: unknown;
}

interface TokenBalance {
  accountIndex: number;
  mint: string;
  owner?: string;
  uiTokenAmount: { uiAmountString?: string; uiAmount?: number | null };
}

interface ParsedTransaction {
  blockTime: number | null;
  transaction: {
    signatures: string[];
    message: {
      accountKeys: Array<string | { pubkey: string }>;
    };
  };
  meta: {
    err: unknown;
    fee?: number;
    preBalances: number[];
    postBalances: number[];
    preTokenBalances?: TokenBalance[];
    postTokenBalances?: TokenBalance[];
    logMessages?: string[];
  } | null;
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(config.solanaRpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Solana RPC ${method} failed (${res.status})`);
  const json = (await res.json()) as JsonRpcResponse<T>;
  if (json.error) throw new Error(json.error.message || `Solana RPC ${method} error`);
  if (json.result === undefined) throw new Error(`Solana RPC ${method} returned no result`);
  return json.result;
}

export async function recentSignatures(address: string, limit = 12): Promise<SignatureInfo[]> {
  return rpc<SignatureInfo[]>("getSignaturesForAddress", [address, { limit, commitment: "confirmed" }]);
}

export async function parsedTransaction(signature: string): Promise<ParsedTransaction | null> {
  return rpc<ParsedTransaction | null>("getTransaction", [
    signature,
    { encoding: "jsonParsed", commitment: "confirmed", maxSupportedTransactionVersion: 0 },
  ]);
}

function uiAmount(balance: TokenBalance | undefined): number {
  if (!balance) return 0;
  const raw = balance.uiTokenAmount.uiAmountString;
  return raw !== undefined ? Number(raw) : Number(balance.uiTokenAmount.uiAmount ?? 0);
}

function dexFromLogs(logs: string[] | undefined): string | null {
  const text = (logs ?? []).join(" ").toLowerCase();
  if (text.includes("jupiter")) return "Jupiter";
  if (text.includes("raydium")) return "Raydium";
  if (text.includes("orca")) return "Orca";
  if (text.includes("meteora")) return "Meteora";
  if (text.includes("pump")) return "Pump.fun";
  return null;
}

/** Parse a standard Solana JSON-RPC transaction using wallet-owned balance changes. */
export function parseRpcSwap(tx: ParsedTransaction, wallet: string): ParsedSwap | null {
  if (!tx.meta || tx.meta.err) return null;
  const signature = tx.transaction.signatures[0];
  if (!signature) return null;

  const keys = tx.transaction.message.accountKeys.map((k) =>
    typeof k === "string" ? k : k.pubkey,
  );
  const walletIndex = keys.indexOf(wallet);
  if (walletIndex < 0) return null;

  const changes = new Map<string, number>();
  const pre = tx.meta.preTokenBalances ?? [];
  const post = tx.meta.postTokenBalances ?? [];
  const balanceKeys = new Set<string>();
  for (const b of [...pre, ...post]) {
    if (b.owner === wallet) balanceKeys.add(`${b.accountIndex}:${b.mint}`);
  }
  for (const key of balanceKeys) {
    const [indexText, mint] = key.split(":");
    const accountIndex = Number(indexText);
    const before = pre.find((b) => b.accountIndex === accountIndex && b.mint === mint);
    const after = post.find((b) => b.accountIndex === accountIndex && b.mint === mint);
    changes.set(mint, uiAmount(after) - uiAmount(before));
  }

  // Native SOL movement. Add the fee back for a fee-paying tracked wallet so
  // a fee alone can never look like a SOL spend.
  const preSol = (tx.meta.preBalances[walletIndex] ?? 0) / LAMPORTS_PER_SOL;
  const postSol = (tx.meta.postBalances[walletIndex] ?? 0) / LAMPORTS_PER_SOL;
  let solChange = postSol - preSol;
  if (walletIndex === 0) solChange += (tx.meta.fee ?? 0) / LAMPORTS_PER_SOL;
  if (Math.abs(solChange) >= MIN_SOL_MOVEMENT) {
    changes.set(WSOL_MINT, (changes.get(WSOL_MINT) ?? 0) + solChange);
  }

  const gains = [...changes].filter(([, amount]) => amount > 1e-9);
  const losses = [...changes].filter(([, amount]) => amount < -1e-9);
  const quoteSpend = losses.find(([mint, amount]) =>
    isQuoteMint(mint) && (mint !== WSOL_MINT || Math.abs(amount) >= MIN_SOL_MOVEMENT),
  );
  const quoteReceive = gains.find(([mint, amount]) =>
    isQuoteMint(mint) && (mint !== WSOL_MINT || amount >= MIN_SOL_MOVEMENT),
  );
  const tokenGain = gains.filter(([mint]) => !isQuoteMint(mint)).sort((a, b) => b[1] - a[1])[0];
  const tokenLoss = losses.filter(([mint]) => !isQuoteMint(mint)).sort((a, b) => a[1] - b[1])[0];
  const blockTime = new Date((tx.blockTime ?? Math.floor(Date.now() / 1000)) * 1000).toISOString();
  const dex = dexFromLogs(tx.meta.logMessages);

  if (quoteSpend && tokenGain) {
    return {
      walletAddress: wallet,
      signature,
      type: "buy",
      tokenMint: tokenGain[0],
      tokenAmount: tokenGain[1],
      quoteMint: quoteSpend[0],
      quoteSymbol: QUOTE_MINTS[quoteSpend[0]] ?? "?",
      quoteAmount: Math.abs(quoteSpend[1]),
      solAmount: quoteSpend[0] === WSOL_MINT ? Math.abs(quoteSpend[1]) : null,
      dex,
      blockTime,
    };
  }

  if (quoteReceive && tokenLoss) {
    return {
      walletAddress: wallet,
      signature,
      type: "sell",
      tokenMint: tokenLoss[0],
      tokenAmount: Math.abs(tokenLoss[1]),
      quoteMint: quoteReceive[0],
      quoteSymbol: QUOTE_MINTS[quoteReceive[0]] ?? "?",
      quoteAmount: quoteReceive[1],
      solAmount: quoteReceive[0] === WSOL_MINT ? quoteReceive[1] : null,
      dex,
      blockTime,
    };
  }

  return null;
}
