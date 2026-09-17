import type { AlertChannel, AlertPayload, AlertResult } from "./types";
import { renderMessage } from "./format";

/**
 * Email alert channel (interface-ready stub).
 *
 * Wire this to your provider of choice (Resend, Postmark, SES). The structure
 * mirrors the other channels so it drops straight into the registry once
 * RESEND_API_KEY / ALERT_EMAIL_* are set.
 */
export const emailChannel: AlertChannel = {
  name: "email",
  isEnabled: () =>
    Boolean(process.env.RESEND_API_KEY && process.env.ALERT_EMAIL_TO && process.env.ALERT_EMAIL_FROM),
  async send(payload: AlertPayload): Promise<AlertResult> {
    if (!this.isEnabled()) return { channel: "email", status: "skipped", detail: "not configured" };
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.ALERT_EMAIL_FROM,
          to: process.env.ALERT_EMAIL_TO,
          subject:
            payload.kind === "social"
              ? `Signal — ${payload.influencerName} mentioned $${payload.tokenSymbol}`
              : `Signal — ${payload.influencerName} ${payload.kind} $${payload.tokenSymbol}`,
          text: `${renderMessage(payload)}\n\n${payload.signalUrl}`,
        }),
      });
      if (!res.ok) return { channel: "email", status: "failed", detail: await res.text() };
      return { channel: "email", status: "sent" };
    } catch (e) {
      return { channel: "email", status: "failed", detail: (e as Error).message };
    }
  },
};
