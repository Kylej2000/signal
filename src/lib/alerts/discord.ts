import { config, hasDiscord } from "@/lib/config";
import type { AlertChannel, AlertPayload, AlertResult } from "./types";
import { isSocial, renderMessage } from "./format";

/** Discord webhook alert channel. */
export const discordChannel: AlertChannel = {
  name: "discord",
  isEnabled: () => hasDiscord(),
  async send(payload: AlertPayload): Promise<AlertResult> {
    if (!hasDiscord()) return { channel: "discord", status: "skipped", detail: "not configured" };
    try {
      const color = isSocial(payload) ? 0x12e6c8 : payload.kind === "buy" ? 0x22c78a : 0xf0526a;
      const res = await fetch(config.discordWebhookUrl as string, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title: isSocial(payload) ? "Social Alert" : `${payload.kind === "buy" ? "Buy" : "Sell"} Alert`,
              description: renderMessage(payload),
              color,
              url: payload.signalUrl,
            },
          ],
        }),
      });
      if (!res.ok) {
        return { channel: "discord", status: "failed", detail: await res.text() };
      }
      return { channel: "discord", status: "sent" };
    } catch (e) {
      return { channel: "discord", status: "failed", detail: (e as Error).message };
    }
  },
};
