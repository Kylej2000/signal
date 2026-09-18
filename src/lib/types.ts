/** Domain types shared across the app (mirrors the Postgres schema). */

export type Chain =
  | "solana"
  | "ethereum"
  | "bnb"
  | "avalanche"
  | "base"
  | "arbitrum"
  | "optimism"
  | "polygon"
  | "robinhood_chain";

export type VerificationStatus =
  | "verified"
  | "publicly_disclosed"
  | "community_reported"
  | "unverified";

export type TransactionType =
  | "buy"
  | "sell"
  | "transfer_in"
  | "transfer_out"
  | "unknown";

export type SocialPlatform = "x";

export type MentionConfidence = "high" | "medium" | "low";

export type SignalType =
  | "wallet_buy"
  | "wallet_sell"
  | "social_mention"
  | "correlated";

export interface Influencer {
  id: string;
  name: string;
  slug: string;
  x_handle: string | null;
  profile_image: string | null;
  followers: number | null;
  category: string | null;
  description: string | null;
  active: boolean;
}

export interface Wallet {
  id: string;
  influencer_id: string;
  address: string;
  chain: Chain;
  label: string | null;
  verification_status: VerificationStatus;
  verification_source: string | null;
  verified_at: string | null;
  active: boolean;
}

export interface Token {
  id: string;
  chain: Chain;
  contract_address: string;
  symbol: string | null;
  name: string | null;
  image_url: string | null;
  decimals: number | null;
  dexscreener_url: string | null;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  token_id: string;
  transaction_hash: string;
  transaction_type: TransactionType;
  token_amount: number | null;
  sol_amount: number | null;
  quote_amount: number | null;
  quote_symbol: string | null;
  usd_value: number | null;
  token_price: number | null;
  market_cap: number | null;
  liquidity: number | null;
  price_source: string | null;
  dex: string | null;
  block_timestamp: string;
  detected_at: string;
}

export interface SocialPost {
  id: string;
  influencer_id: string;
  platform: SocialPlatform;
  post_id: string;
  post_url: string | null;
  content: string | null;
  posted_at: string;
  detected_at: string;
}

export interface SocialTokenMention {
  id: string;
  social_post_id: string;
  token_id: string | null;
  ticker: string | null;
  contract_address: string | null;
  confidence: MentionConfidence;
  match_reason: string | null;
}

export interface Signal {
  id: string;
  influencer_id: string;
  token_id: string | null;
  transaction_id: string | null;
  social_post_id: string | null;
  signal_type: SignalType;
  correlated_transaction_id: string | null;
  seconds_between: number | null;
  created_at: string;
}

/**
 * A denormalised feed item — what the UI actually renders. Assembled either
 * from the demo dataset or from the `feed_signals` view.
 */
export interface FeedItem {
  id: string;
  signal_type: SignalType;
  created_at: string;
  seconds_between: number | null;

  influencer: {
    id: string;
    name: string;
    slug: string;
    x_handle: string | null;
    profile_image: string | null;
  };

  token: {
    id: string;
    symbol: string | null;
    name: string | null;
    contract_address: string;
    image_url: string | null;
    dexscreener_url: string | null;
    chain?: Chain;
  } | null;

  // Present for wallet_buy / wallet_sell
  transaction?: {
    id: string;
    transaction_hash: string;
    transaction_type: TransactionType;
    usd_value: number | null;
    token_amount: number | null;
    sol_amount: number | null;
    quote_amount?: number | null;
    quote_symbol?: string | null;
    market_cap: number | null;
    liquidity: number | null;
    token_price: number | null;
    dex: string | null;
    block_timestamp: string;
    detected_at: string;
    price_source: string | null;
    wallet_address_masked: string | null;
    chain?: Chain;
  } | null;

  // Present for social_mention / correlated
  post?: {
    id: string;
    post_url: string | null;
    content: string | null;
    posted_at: string;
  } | null;

  // For correlated items: details of the earlier wallet purchase.
  correlation?: {
    transaction_id: string;
    seconds_between: number;
    market_cap_at_purchase: number | null;
    purchase_time: string;
  } | null;

  demo?: boolean;
}

export interface InfluencerStats {
  buys_30d: number;
  sells_30d: number;
  tokens_bought: number;
  average_purchase_usd: number | null;
  social_mentions_30d: number;
}

export interface InfluencerDirectoryEntry extends Influencer {
  wallet_count: number;
  verified_wallet_count: number;
  primary_chain: Chain;
  last_activity: string | null;
}
