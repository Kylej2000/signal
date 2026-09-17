import { config, hasTelegram } from "@/lib/config";
import type { AlertChannel, AlertPayload, AlertResult } from "./types";
import { isSocial, renderMessage } from "./format";

/** Telegram alert channel. Designed to be the flagship push channel. */
export const telegramChannel: AlertChannel = {
  name: "telegram",
  isEnabled: () => hasTelegram(),
  async send(payload: AlertPayload): Promise<AlertResult> {
    if (!hasTelegram()) return { channel: "telegram", status: "skipped", detail: "not configured" };
    try {
      const text = renderMessage(payload);
      const buttons = inlineButtons(payload);
      const res = await fetch(
        `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            chat_id: config.telegram.chatId,
            text,
            disable_web_page_preview: false,
            reply_markup: { inline_keyboard: buttons },
          }),
        },
      );
      if (!res.ok) {
        const detail = await res.text();
        return { channel: "telegram", status: "failed", detail };
      }
      return { channel: "telegram", status: "sent" };
    } catch (e) {
      return { channel: "telegram", status: "failed", detail: (e as Error).message };
    }
  },
};

function inlineButtons(payload: AlertPayload) {
  if (isSocial(payload)) {
    const row = [] as { text: string; url: string }[];
    if (payload.postUrl) row.push({ text: "View Post", url: payload.postUrl });
    if (payload.originalBuyUrl) row.push({ text: "View Original Buy", url: payload.originalBuyUrl });
    row.push({ text: "Open in Signal", url: payload.signalUrl });
    return [row];
  }
  const row = [] as { text: string; url: string }[];
  row.push({ text: "Transaction", url: `https://solscan.io/tx/${payload.txHash}` });
  if (payload.dexscreenerUrl) row.push({ text: "DexScreener", url: payload.dexscreenerUrl });
  return [row, [{ text: "Open in Signal", url: payload.signalUrl }]];
}
