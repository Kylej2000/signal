/** Shared human-readable formatting for alert messages (plain-text style). */

import { compactNumber, formatDuration, formatUsd } from "@/lib/format";
import type { AlertPayload, BuyAlertPayload, SocialAlertPayload } from "./types";

export function isSocial(p: AlertPayload): p is SocialAlertPayload {
  return p.kind === "social";
}

/** Telegram-style message (used by Telegram + a base for others). */
export function renderBuyMessage(p: BuyAlertPayload): string {
  const verb = p.kind === "buy" ? "Bought" : "Sold";
  const emoji = p.kind === "buy" ? "🟢" : "🔴";
  const lines = [
    `🚨 INFLUENCER ${p.kind === "buy" ? "BUY" : "SELL"} ALERT`,
    ``,
    `${p.influencerName}`,
    ``,
    `${emoji} ${verb}: $${p.tokenSymbol ?? "?"}`,
    ``,
    `💰 ${p.kind === "buy" ? "Purchase" : "Proceeds"}: ${formatUsd(p.usdValue)}`,
    `📊 Market Cap: $${compactNumber(p.marketCap)}`,
    `💧 Liquidity: $${compactNumber(p.liquidity)}`,
    `⛓ Chain: ${p.chain}`,
    `🔄 DEX: ${p.dex ?? "—"}`,
  ];
  if (p.walletMasked) {
    lines.push(``, `Wallet:`, p.walletMasked);
  }
  if (p.detectionSeconds != null) {
    lines.push(``, `Detected:`, `${p.detectionSeconds} seconds after confirmation`);
  }
  return lines.join("\n");
}

export function renderSocialMessage(p: SocialAlertPayload): string {
  const lines = [`🚨 SOCIAL ALERT`, ``];
  if (p.correlationSeconds != null) {
    lines.push(
      `${p.influencerName} just mentioned $${p.tokenSymbol ?? "?"} on X.`,
      ``,
      `His/her monitored wallet purchased it ${formatDuration(p.correlationSeconds)} earlier.`,
    );
  } else {
    lines.push(`${p.influencerName} just mentioned $${p.tokenSymbol ?? "?"} on X.`);
  }
  return lines.join("\n");
}

export function renderMessage(p: AlertPayload): string {
  return isSocial(p) ? renderSocialMessage(p) : renderBuyMessage(p);
}
