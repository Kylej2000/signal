import type { ParsedSwap } from "@/lib/solana/parser";
import type { EvmChainConfig } from "./chains";

const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

async function rpc<T>(chain: EvmChainConfig, method: string, params: unknown[]): Promise<T> {
  if (!chain.rpcUrl) throw new Error(`${chain.label} RPC is not configured`);
  const response = await fetch(chain.rpcUrl, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }), cache: "no-store",
  });
  if (!response.ok) throw new Error(`${chain.label} RPC returned ${response.status}`);
  const body = await response.json() as { result?: T; error?: { message?: string } };
  if (body.error) throw new Error(body.error.message || `${method} failed`);
  return body.result as T;
}

const topicAddress = (address: string) => `0x${address.toLowerCase().slice(2).padStart(64, "0")}`;
const fromHex = (value?: string | null) => value ? BigInt(value) : 0n;

interface Log { address: string; topics: string[]; data: string; transactionHash: string; }
interface Receipt { logs: Log[]; blockNumber: string; }
interface Tx { hash: string; from: string; value: string; }

async function tokenCall(chain: EvmChainConfig, token: string, data: string): Promise<string | null> {
  try { return await rpc<string>(chain, "eth_call", [{ to: token, data }, "latest"]); }
  catch { return null; }
}

async function tokenMeta(chain: EvmChainConfig, token: string) {
  const [decHex, symHex] = await Promise.all([
    tokenCall(chain, token, "0x313ce567"), tokenCall(chain, token, "0x95d89b41"),
  ]);
  const decimals = decHex ? Number(fromHex(decHex)) : 18;
  let symbol: string | null = null;
  if (symHex && symHex.length >= 130) {
    try {
      const length = Number.parseInt(symHex.slice(66, 130), 16);
      symbol = Buffer.from(symHex.slice(130, 130 + length * 2), "hex").toString("utf8").replace(/\0/g, "") || null;
    } catch { symbol = null; }
  }
  return { decimals, symbol };
}

export async function recentEvmSwaps(
  chain: EvmChainConfig,
  walletAddress: string,
): Promise<ParsedSwap[]> {
  const wallet = walletAddress.toLowerCase();
  const latestHex = await rpc<string>(chain, "eth_blockNumber", []);
  const latest = Number(fromHex(latestHex));
  const lookback = Math.max(20, Number(process.env.EVM_BLOCK_LOOKBACK || 300));
  const range = { fromBlock: `0x${Math.max(0, latest - lookback).toString(16)}`, toBlock: "latest" };
  const walletTopic = topicAddress(wallet);
  const [incoming, outgoing] = await Promise.all([
    rpc<Log[]>(chain, "eth_getLogs", [{ ...range, topics: [TRANSFER_TOPIC, null, walletTopic] }]),
    rpc<Log[]>(chain, "eth_getLogs", [{ ...range, topics: [TRANSFER_TOPIC, walletTopic] }]),
  ]);
  const hashes = [...new Set([...incoming, ...outgoing].map((log) => log.transactionHash))]
    .slice(-Math.max(1, Number(process.env.EVM_MAX_TRANSACTIONS || 20)));
  const swaps: ParsedSwap[] = [];

  for (const hash of hashes) {
    const [receipt, tx] = await Promise.all([
      rpc<Receipt>(chain, "eth_getTransactionReceipt", [hash]),
      rpc<Tx>(chain, "eth_getTransactionByHash", [hash]),
    ]);
    const net = new Map<string, bigint>();
    for (const log of receipt.logs ?? []) {
      if (log.topics?.[0]?.toLowerCase() !== TRANSFER_TOPIC || log.topics.length < 3) continue;
      const from = `0x${log.topics[1].slice(-40)}`.toLowerCase();
      const to = `0x${log.topics[2].slice(-40)}`.toLowerCase();
      if (from !== wallet && to !== wallet) continue;
      const amount = fromHex(log.data);
      const token = log.address.toLowerCase();
      net.set(token, (net.get(token) ?? 0n) + (to === wallet ? amount : -amount));
    }
    const entries = await Promise.all([...net.entries()].map(async ([token, raw]) => {
      const meta = await tokenMeta(chain, token);
      return { token, raw, amount: Number(raw) / 10 ** meta.decimals, symbol: meta.symbol };
    }));
    let quote = entries.find((e) => chain.quoteTokens[e.token] && e.raw < 0n);
    let target = entries.filter((e) => !chain.quoteTokens[e.token] && e.raw > 0n).sort((a, b) => b.amount - a.amount)[0];
    let type: "buy" | "sell" = "buy";
    if (!quote || !target) {
      quote = entries.find((e) => chain.quoteTokens[e.token] && e.raw > 0n);
      target = entries.filter((e) => !chain.quoteTokens[e.token] && e.raw < 0n).sort((a, b) => a.amount - b.amount)[0];
      type = "sell";
    }
    let quoteAmount = quote ? Math.abs(quote.amount) : 0;
    let quoteSymbol = quote ? chain.quoteTokens[quote.token] : chain.nativeSymbol;
    if (type === "buy" && !quote && tx.from?.toLowerCase() === wallet && fromHex(tx.value) > 0n) {
      quoteAmount = Number(fromHex(tx.value)) / 1e18;
    }
    if (!target || quoteAmount <= 0) continue;
    const block = await rpc<{ timestamp: string }>(chain, "eth_getBlockByNumber", [receipt.blockNumber, false]);
    swaps.push({
      chain: chain.id, walletAddress, signature: hash, type,
      tokenMint: target.token, tokenAmount: Math.abs(target.amount),
      quoteMint: quote?.token ?? "native", quoteSymbol, quoteAmount,
      solAmount: null, dex: null,
      blockTime: new Date(Number(fromHex(block.timestamp)) * 1000).toISOString(),
      explorerUrl: `${chain.explorer}/tx/${hash}`,
    });
  }
  return swaps;
}
