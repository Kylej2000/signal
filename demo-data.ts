/**
 * DEMO DATA
 * -----------------------------------------------------------------------------
 * Realistic but ENTIRELY FICTIONAL sample data so the whole UX works before any
 * API keys are added. Nothing here represents a real person, wallet, token or
 * transaction. Timestamps are generated relative to "now" on each call so the
 * feed always looks live.
 *
 * Everything produced here is flagged `demo: true` and rendered with a DEMO
 * badge in the UI.
 */

import type {
  FeedItem,
  Influencer,
  InfluencerDirectoryEntry,
  InfluencerStats,
  Token,
  Wallet,
} from "./types";
import { maskAddress } from "./format";

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const secondsAgo = (s: number) => new Date(Date.now() - s * 1000).toISOString();

// ----------------------------------------------------------------------------
// Influencers
// ----------------------------------------------------------------------------
export const demoInfluencers: Influencer[] = [
  {
    id: "inf-john",
    name: "Crypto God John",
    slug: "crypto-god-john",
    x_handle: "CryptoGodJohn",
    profile_image: null,
    followers: 462_000,
    category: "Solana Trader",
    description:
      "High-conviction Solana memecoin trader. Known for early entries and fast exits. (Sample profile — fictional.)",
    active: true,
  },
  {
    id: "inf-sasha",
    name: "Solana Sasha",
    slug: "solana-sasha",
    x_handle: "SolanaSasha",
    profile_image: null,
    followers: 188_000,
    category: "On-chain Analyst",
    description:
      "On-chain analytics and early token discovery on Solana. (Sample profile — fictional.)",
    active: true,
  },
  {
    id: "inf-dan",
    name: "DeFi Dan",
    slug: "defi-dan",
    x_handle: "DeFiDan",
    profile_image: null,
    followers: 96_500,
    category: "DeFi / Yield",
    description: "DeFi strategist and yield farmer. (Sample profile — fictional.)",
    active: true,
  },
  {
    id: "inf-mara",
    name: "Meme Mara",
    slug: "meme-mara",
    x_handle: "MemeMara",
    profile_image: null,
    followers: 254_000,
    category: "Memecoin Hunter",
    description: "Full-time memecoin degenerate. (Sample profile — fictional.)",
    active: true,
  },
  {
    id: "inf-quant",
    name: "QuantWizard",
    slug: "quant-wizard",
    x_handle: "QuantWizardSol",
    profile_image: null,
    followers: 71_200,
    category: "Systematic",
    description: "Systematic on-chain strategies. (Sample profile — fictional.)",
    active: true,
  },
];

// ----------------------------------------------------------------------------
// Wallets
// ----------------------------------------------------------------------------
export const demoWallets: Wallet[] = [
  {
    id: "w-john-1",
    influencer_id: "inf-john",
    address: "Aacn8Xy1Q9m2r4t6u8w0z2b4d6f8h0j2k4m6p8r8YSC",
    chain: "solana",
    label: "Main",
    verification_status: "publicly_disclosed",
    verification_source: "https://x.com/CryptoGodJohn/status/000",
    verified_at: minutesAgo(60 * 24 * 90),
    active: true,
  },
  {
    id: "w-john-2",
    influencer_id: "inf-john",
    address: "BdxLp5Kq3n1v7c9x2z4b6d8f0h2j4l6n8p0r2t4v6WQE",
    chain: "solana",
    label: "Degen",
    verification_status: "verified",
    verification_source: "https://solscan.io/account/BdxLp5Kq3n1v7c9x2z4b6d8f0h2j4l6n8p0r2t4v6WQE",
    verified_at: minutesAgo(60 * 24 * 60),
    active: true,
  },
  {
    id: "w-sasha-1",
    influencer_id: "inf-sasha",
    address: "Ck9Rm2Ht4p6s8u0w2y4a6c8e0g2i4k6m8o0q2s4u6TZP",
    chain: "solana",
    label: "Main",
    verification_status: "publicly_disclosed",
    verification_source: "https://x.com/SolanaSasha/status/000",
    verified_at: minutesAgo(60 * 24 * 45),
    active: true,
  },
  {
    id: "w-dan-1",
    influencer_id: "inf-dan",
    address: "Dm4Wn6Ju8q0t2v4x6z8b0d2f4h6j8l0n2p4r6t8v0YRK",
    chain: "solana",
    label: "Main",
    verification_status: "community_reported",
    verification_source: "https://x.com/someuser/status/000",
    verified_at: null,
    active: true,
  },
  {
    id: "w-mara-1",
    influencer_id: "inf-mara",
    address: "Ef6Yp8Lr0s2u4w6y8a0c2e4g6i8k0m2o4q6s8u0ZXN",
    chain: "solana",
    label: "Main",
    verification_status: "verified",
    verification_source: "https://x.com/MemeMara/status/000",
    verified_at: minutesAgo(60 * 24 * 30),
    active: true,
  },
  {
    id: "w-quant-1",
    influencer_id: "inf-quant",
    address: "Gh8Zq0Ms2t4v6x8z0b2d4f6h8j0l2n4p6r8t0v2ABC",
    chain: "solana",
    label: "Systematic",
    verification_status: "publicly_disclosed",
    verification_source: "https://x.com/QuantWizardSol/status/000",
    verified_at: minutesAgo(60 * 24 * 20),
    active: true,
  },
];

// ----------------------------------------------------------------------------
// Tokens
// ----------------------------------------------------------------------------
export const demoTokens: Token[] = [
  {
    id: "t-jubjub",
    chain: "solana",
    contract_address: "JUBJUBmintExample1111111111111111111111111",
    symbol: "JUBJUB",
    name: "JubJub",
    image_url: null,
    decimals: 6,
    dexscreener_url: "https://dexscreener.com/solana/JUBJUBmintExample1111111111111111111111111",
  },
  {
    id: "t-wif",
    chain: "solana",
    contract_address: "WIFmintExample2222222222222222222222222222",
    symbol: "WIF",
    name: "dogwifhat",
    image_url: null,
    decimals: 6,
    dexscreener_url: "https://dexscreener.com/solana/WIFmintExample2222222222222222222222222222",
  },
  {
    id: "t-pnut",
    chain: "solana",
    contract_address: "PNUTmintExample3333333333333333333333333333",
    symbol: "PNUT",
    name: "Peanut",
    image_url: null,
    decimals: 6,
    dexscreener_url: "https://dexscreener.com/solana/PNUTmintExample3333333333333333333333333333",
  },
  {
    id: "t-mew",
    chain: "solana",
    contract_address: "MEWmintExample44444444444444444444444444444",
    symbol: "MEW",
    name: "cat in a dogs world",
    image_url: null,
    decimals: 6,
    dexscreener_url: "https://dexscreener.com/solana/MEWmintExample44444444444444444444444444444",
  },
  {
    id: "t-bonk",
    chain: "solana",
    contract_address: "BONKmintExample5555555555555555555555555555",
    symbol: "BONK",
    name: "Bonk",
    image_url: null,
    decimals: 5,
    dexscreener_url: "https://dexscreener.com/solana/BONKmintExample5555555555555555555555555555",
  },
  {
    id: "t-froth",
    chain: "solana",
    contract_address: "FROTHmintExample666666666666666666666666666",
    symbol: "FROTH",
    name: "Froth",
    image_url: null,
    decimals: 6,
    dexscreener_url: "https://dexscreener.com/solana/FROTHmintExample666666666666666666666666666",
  },
];

// Quick lookups
const tokenById = Object.fromEntries(demoTokens.map((t) => [t.id, t]));
const influencerById = Object.fromEntries(demoInfluencers.map((i) => [i.id, i]));
const walletById = Object.fromEntries(demoWallets.map((w) => [w.id, w]));

// ----------------------------------------------------------------------------
// Buy/sell events (raw), assembled into FeedItems below
// ----------------------------------------------------------------------------
interface DemoTx {
  id: string;
  walletId: string;
  tokenId: string;
  type: "buy" | "sell";
  hash: string;
  tokenAmount: number;
  solAmount: number;
  usd: number;
  price: number;
  marketCap: number;
  liquidity: number;
  dex: string;
  minutesAgo: number;
  detectionSeconds: number; // detection latency
}

const demoTxs: DemoTx[] = [
  {
    id: "tx-jubjub",
    walletId: "w-john-1",
    tokenId: "t-jubjub",
    type: "buy",
    hash: "5xSigJUBJUBexampleaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa11",
    tokenAmount: 6_489_792,
    solAmount: 4.83,
    usd: 966,
    price: 0.000149,
    marketCap: 130_000,
    liquidity: 82_000,
    dex: "Jupiter",
    minutesAgo: 0.7,
    detectionSeconds: 5,
  },
  {
    id: "tx-pnut",
    walletId: "w-sasha-1",
    tokenId: "t-pnut",
    type: "buy",
    hash: "5xSigPNUTexamplebbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb22",
    tokenAmount: 95_000,
    solAmount: 8.1,
    usd: 1_620,
    price: 0.017,
    marketCap: 1_700_000,
    liquidity: 210_000,
    dex: "Jupiter",
    minutesAgo: 20,
    detectionSeconds: 4,
  },
  {
    id: "tx-mew",
    walletId: "w-mara-1",
    tokenId: "t-mew",
    type: "buy",
    hash: "5xSigMEWexampleccccccccccccccccccccccccccccccccccccccccccccccc33",
    tokenAmount: 420_000,
    solAmount: 6.2,
    usd: 1_240,
    price: 0.00295,
    marketCap: 260_000_000,
    liquidity: 3_100_000,
    dex: "Raydium",
    minutesAgo: 34,
    detectionSeconds: 6,
  },
  {
    id: "tx-froth",
    walletId: "w-john-2",
    tokenId: "t-froth",
    type: "buy",
    hash: "5xSigFROTHexampleddddddddddddddddddddddddddddddddddddddddddddd44",
    tokenAmount: 12_800_000,
    solAmount: 2.1,
    usd: 420,
    price: 0.0000328,
    marketCap: 61_000,
    liquidity: 44_000,
    dex: "Jupiter",
    minutesAgo: 52,
    detectionSeconds: 7,
  },
  {
    id: "tx-wif",
    walletId: "w-john-2",
    tokenId: "t-wif",
    type: "buy",
    hash: "5xSigWIFexampleeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee55",
    tokenAmount: 1_240,
    solAmount: 12.4,
    usd: 2_480,
    price: 2.0,
    marketCap: 2_400_000_000,
    liquidity: 5_400_000,
    dex: "Raydium",
    minutesAgo: 182,
    detectionSeconds: 6,
  },
  {
    id: "tx-bonk-sell",
    walletId: "w-quant-1",
    tokenId: "t-bonk",
    type: "sell",
    hash: "5xSigBONKexampleffffffffffffffffffffffffffffffffffffffffffffff66",
    tokenAmount: 220_000_000,
    solAmount: 9.4,
    usd: 1_880,
    price: 0.0000214,
    marketCap: 1_500_000_000,
    liquidity: 12_000_000,
    dex: "Raydium",
    minutesAgo: 240,
    detectionSeconds: 5,
  },
];

// ----------------------------------------------------------------------------
// Social posts, some correlated to a prior wallet buy
// ----------------------------------------------------------------------------
interface DemoPost {
  id: string;
  influencerId: string;
  tokenId: string;
  postId: string;
  content: string;
  minutesAgo: number;
  correlatesTxId?: string; // the earlier wallet buy of the same token
}

const demoPosts: DemoPost[] = [
  {
    id: "sp-jubjub",
    influencerId: "inf-john",
    tokenId: "t-jubjub",
    postId: "1900000000000000001",
    content: "Interesting project I've been watching... $JUBJUB",
    minutesAgo: 0.3, // ~a few seconds after the buy in this demo timeline
    correlatesTxId: "tx-jubjub",
  },
  {
    id: "sp-pnut",
    influencerId: "inf-sasha",
    tokenId: "t-pnut",
    postId: "1900000000000000002",
    content: "This one is early. $PNUT chart looks primed. NFA.",
    minutesAgo: 11,
    correlatesTxId: "tx-pnut",
  },
  {
    id: "sp-mew",
    influencerId: "inf-mara",
    tokenId: "t-mew",
    postId: "1900000000000000003",
    content: "cats > dogs. $MEW accumulation zone imo 🐱",
    minutesAgo: 22,
    correlatesTxId: "tx-mew",
  },
  {
    id: "sp-random",
    influencerId: "inf-dan",
    tokenId: "t-bonk",
    postId: "1900000000000000004",
    content: "$BONK still the liquidity king on Solana. Watching for a reclaim.",
    minutesAgo: 75,
    // no correlated wallet buy => plain social mention
  },
];

// ----------------------------------------------------------------------------
// FeedItem builders
// ----------------------------------------------------------------------------
function buildTxFeedItem(tx: DemoTx): FeedItem {
  const wallet = walletById[tx.walletId];
  const inf = influencerById[wallet.influencer_id];
  const token = tokenById[tx.tokenId];
  const blockTs = minutesAgo(tx.minutesAgo);
  const detectedTs = new Date(
    new Date(blockTs).getTime() + tx.detectionSeconds * 1000,
  ).toISOString();

  return {
    id: `sig-${tx.id}`,
    signal_type: tx.type === "buy" ? "wallet_buy" : "wallet_sell",
    created_at: detectedTs,
    seconds_between: null,
    influencer: {
      id: inf.id,
      name: inf.name,
      slug: inf.slug,
      x_handle: inf.x_handle,
      profile_image: inf.profile_image,
    },
    token: {
      id: token.id,
      symbol: token.symbol,
      name: token.name,
      contract_address: token.contract_address,
      image_url: token.image_url,
      dexscreener_url: token.dexscreener_url,
    },
    transaction: {
      id: tx.id,
      transaction_hash: tx.hash,
      transaction_type: tx.type,
      usd_value: tx.usd,
      token_amount: tx.tokenAmount,
      sol_amount: tx.solAmount,
      market_cap: tx.marketCap,
      liquidity: tx.liquidity,
      token_price: tx.price,
      dex: tx.dex,
      block_timestamp: blockTs,
      detected_at: detectedTs,
      price_source: "birdeye_historical",
      wallet_address_masked: maskAddress(wallet.address),
    },
    post: null,
    correlation: null,
    demo: true,
  };
}

function buildPostFeedItem(post: DemoPost): FeedItem {
  const inf = influencerById[post.influencerId];
  const token = tokenById[post.tokenId];
  const postedTs = minutesAgo(post.minutesAgo);
  const detectedTs = new Date(new Date(postedTs).getTime() + 25_000).toISOString();

  const corrTx = post.correlatesTxId
    ? demoTxs.find((t) => t.id === post.correlatesTxId)
    : undefined;

  let correlation: FeedItem["correlation"] = null;
  let secondsBetween: number | null = null;
  if (corrTx) {
    const purchaseTs = minutesAgo(corrTx.minutesAgo);
    secondsBetween = Math.round(
      (new Date(postedTs).getTime() - new Date(purchaseTs).getTime()) / 1000,
    );
    correlation = {
      transaction_id: corrTx.id,
      seconds_between: secondsBetween,
      market_cap_at_purchase: corrTx.marketCap,
      purchase_time: purchaseTs,
    };
  }

  return {
    id: `sig-${post.id}`,
    signal_type: corrTx ? "correlated" : "social_mention",
    created_at: detectedTs,
    seconds_between: secondsBetween,
    influencer: {
      id: inf.id,
      name: inf.name,
      slug: inf.slug,
      x_handle: inf.x_handle,
      profile_image: inf.profile_image,
    },
    token: {
      id: token.id,
      symbol: token.symbol,
      name: token.name,
      contract_address: token.contract_address,
      image_url: token.image_url,
      dexscreener_url: token.dexscreener_url,
    },
    transaction: null,
    post: {
      id: post.id,
      post_url: `https://x.com/${inf.x_handle}/status/${post.postId}`,
      content: post.content,
      posted_at: postedTs,
    },
    correlation,
    demo: true,
  };
}

/** All feed items, newest first. */
export function demoFeed(): FeedItem[] {
  const items = [
    ...demoTxs.map(buildTxFeedItem),
    ...demoPosts.map(buildPostFeedItem),
  ];
  return items.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function demoFeedByInfluencer(slug: string): FeedItem[] {
  return demoFeed().filter((f) => f.influencer.slug === slug);
}

export function demoFeedItemById(id: string): FeedItem | null {
  return demoFeed().find((f) => f.id === id) ?? null;
}

// ----------------------------------------------------------------------------
// Directory + profile helpers
// ----------------------------------------------------------------------------
export function demoDirectory(): InfluencerDirectoryEntry[] {
  return demoInfluencers.map((inf) => {
    const wallets = demoWallets.filter((w) => w.influencer_id === inf.id);
    const verified = wallets.filter(
      (w) => w.verification_status === "verified" || w.verification_status === "publicly_disclosed",
    );
    const activity = demoFeed().filter((f) => f.influencer.id === inf.id);
    return {
      ...inf,
      wallet_count: wallets.length,
      verified_wallet_count: verified.length,
      primary_chain: "solana",
      last_activity: activity[0]?.created_at ?? null,
    };
  });
}

export function demoInfluencerBySlug(slug: string): Influencer | null {
  return demoInfluencers.find((i) => i.slug === slug) ?? null;
}

export function demoWalletsForInfluencer(influencerId: string): Wallet[] {
  return demoWallets.filter((w) => w.influencer_id === influencerId);
}

export function demoStats(influencerId: string): InfluencerStats {
  const feed = demoFeed().filter((f) => f.influencer.id === influencerId);
  const buys = feed.filter((f) => f.signal_type === "wallet_buy");
  const sells = feed.filter((f) => f.signal_type === "wallet_sell");
  const mentions = feed.filter(
    (f) => f.signal_type === "social_mention" || f.signal_type === "correlated",
  );
  const buyUsd = buys
    .map((b) => b.transaction?.usd_value ?? 0)
    .filter((n) => n > 0);
  const avg = buyUsd.length
    ? buyUsd.reduce((a, b) => a + b, 0) / buyUsd.length
    : null;
  const distinctTokens = new Set(buys.map((b) => b.token?.id).filter(Boolean));
  return {
    buys_30d: buys.length,
    sells_30d: sells.length,
    tokens_bought: distinctTokens.size,
    average_purchase_usd: avg,
    social_mentions_30d: mentions.length,
  };
}

/** Correlated wallet->social events for an influencer's profile. */
export function demoCorrelations(influencerId: string): FeedItem[] {
  return demoFeed().filter(
    (f) => f.influencer.id === influencerId && f.signal_type === "correlated",
  );
}
