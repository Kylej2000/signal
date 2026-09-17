/** Alert payloads + channel interface shared by all alert channels. */

export interface BuyAlertPayload {
  kind: "buy" | "sell";
  influencerName: string;
  tokenSymbol: string | null;
  usdValue: number | null;
  marketCap: number | null;
  liquidity: number | null;
  dex: string | null;
  chain: string;
  walletMasked: string | null;
  detectionSeconds: number | null;
  txHash: string;
  dexscreenerUrl: string | null;
  signalUrl: string;
}

export interface SocialAlertPayload {
  kind: "social";
  influencerName: string;
  tokenSymbol: string | null;
  postUrl: string | null;
  /** seconds the wallet purchase preceded the post (correlated only) */
  correlationSeconds: number | null;
  originalBuyUrl: string | null;
  signalUrl: string;
}

export type AlertPayload = BuyAlertPayload | SocialAlertPayload;

export interface AlertResult {
  channel: string;
  status: "sent" | "failed" | "skipped";
  detail?: string;
}

/**
 * An alert channel. Adding a new channel (e.g. Telegram) is just implementing
 * this interface and registering it in `lib/alerts/index.ts`.
 */
export interface AlertChannel {
  name: string;
  /** Whether this channel is configured/enabled in the current environment. */
  isEnabled(): boolean;
  send(payload: AlertPayload): Promise<AlertResult>;
}
