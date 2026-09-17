/**
 * Social token-mention extraction + confidence scoring.
 * -----------------------------------------------------------------------------
 * We extract cashtags, Solana contract addresses and DexScreener links from a
 * post, then score how confidently each maps to a specific token:
 *
 *   HIGH   — exact contract address, a DexScreener/token link, OR a cashtag
 *            that uniquely matches a token the influencer's monitored wallet
 *            recently bought.
 *   MEDIUM — a cashtag that uniquely matches exactly one token already in the DB.
 *   LOW    — an ambiguous cashtag with no strong contextual match.
 *
 * A bare "$CAT" alone is intentionally NOT enough to confirm a specific token.
 */

import type { MentionConfidence } from "@/lib/types";

const BASE58 = "[1-9A-HJ-NP-Za-km-z]";
// Solana addresses are base58, typically 32–44 chars.
const SOL_ADDRESS_RE = new RegExp(`\\b${BASE58}{32,44}\\b`, "g");
const CASHTAG_RE = /\$([A-Za-z][A-Za-z0-9]{1,14})\b/g;
const DEXSCREENER_RE = /dexscreener\.com\/solana\/([1-9A-HJ-NP-Za-km-z]{32,44})/gi;
const BIRDEYE_RE = /birdeye\.so\/token\/([1-9A-HJ-NP-Za-km-z]{32,44})/gi;

export interface RawMention {
  kind: "cashtag" | "contract" | "link";
  ticker?: string;
  address?: string;
}

/** Extract raw candidate mentions from post text. */
export function extractRawMentions(content: string): RawMention[] {
  const out: RawMention[] = [];
  const seen = new Set<string>();

  const push = (m: RawMention) => {
    const key = `${m.kind}:${m.ticker ?? ""}:${m.address ?? ""}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(m);
  };

  // Links first (strongest).
  for (const m of content.matchAll(DEXSCREENER_RE)) push({ kind: "link", address: m[1] });
  for (const m of content.matchAll(BIRDEYE_RE)) push({ kind: "link", address: m[1] });

  // Bare contract addresses.
  for (const m of content.matchAll(SOL_ADDRESS_RE)) {
    const addr = m[0];
    // Skip if already captured via a link.
    if (!out.some((x) => x.address === addr)) push({ kind: "contract", address: addr });
  }

  // Cashtags.
  for (const m of content.matchAll(CASHTAG_RE)) {
    push({ kind: "cashtag", ticker: m[1].toUpperCase() });
  }

  return out;
}

export interface TokenLite {
  id: string;
  symbol: string | null;
  contract_address: string;
}

export interface ResolvedMention {
  token_id: string | null;
  ticker: string | null;
  contract_address: string | null;
  confidence: MentionConfidence;
  match_reason: string;
}

/**
 * Resolve raw mentions against known tokens + the set of mints the influencer's
 * monitored wallets recently bought (for the contextual HIGH-confidence boost).
 */
export function resolveMentions(
  raw: RawMention[],
  knownTokens: TokenLite[],
  recentlyBoughtMints: Set<string>,
): ResolvedMention[] {
  const bySymbol = new Map<string, TokenLite[]>();
  const byMint = new Map<string, TokenLite>();
  for (const t of knownTokens) {
    if (t.symbol) {
      const key = t.symbol.toUpperCase();
      bySymbol.set(key, [...(bySymbol.get(key) ?? []), t]);
    }
    byMint.set(t.contract_address, t);
  }

  const resolved: ResolvedMention[] = [];

  for (const m of raw) {
    if (m.address) {
      const token = byMint.get(m.address) ?? null;
      resolved.push({
        token_id: token?.id ?? null,
        ticker: token?.symbol ?? null,
        contract_address: m.address,
        confidence: "high",
        match_reason:
          m.kind === "link"
            ? "Direct DexScreener/Birdeye link to the token"
            : "Exact contract address in post",
      });
      continue;
    }

    if (m.ticker) {
      const matches = bySymbol.get(m.ticker) ?? [];
      if (matches.length === 1) {
        const token = matches[0];
        const contextual = recentlyBoughtMints.has(token.contract_address);
        resolved.push({
          token_id: token.id,
          ticker: m.ticker,
          contract_address: token.contract_address,
          confidence: contextual ? "high" : "medium",
          match_reason: contextual
            ? "Cashtag uniquely matches a token the influencer's wallet recently bought"
            : "Cashtag uniquely matches one known token",
        });
      } else if (matches.length > 1) {
        resolved.push({
          token_id: null,
          ticker: m.ticker,
          contract_address: null,
          confidence: "low",
          match_reason: "Ambiguous cashtag — matches multiple tokens",
        });
      } else {
        resolved.push({
          token_id: null,
          ticker: m.ticker,
          contract_address: null,
          confidence: "low",
          match_reason: "Cashtag with no known token match",
        });
      }
    }
  }

  return resolved;
}
