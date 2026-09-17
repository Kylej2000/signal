/**
 * Alert service.
 * -----------------------------------------------------------------------------
 * Central dispatcher across all configured channels. The IN-APP alert is the
 * signal row itself (the dashboard subscribes to it via Supabase realtime), so
 * the in-app channel simply records a delivery. Telegram / Discord / Email fire
 * only when configured — nothing throws when they're not.
 *
 * Adding a channel: implement AlertChannel and push it into `channels`.
 */

import type { AlertChannel, AlertPayload, AlertResult } from "./types";
import { telegramChannel } from "./telegram";
import { discordChannel } from "./discord";
import { emailChannel } from "./email";
import { getAdminClient } from "@/lib/supabase/server";

const inAppChannel: AlertChannel = {
  name: "inapp",
  isEnabled: () => true,
  async send(): Promise<AlertResult> {
    // The dashboard realtime subscription IS the in-app alert delivery.
    return { channel: "inapp", status: "sent" };
  },
};

export const channels: AlertChannel[] = [
  inAppChannel,
  telegramChannel,
  discordChannel,
  emailChannel,
];

export function enabledChannels(): AlertChannel[] {
  return channels.filter((c) => c.isEnabled());
}

/**
 * Dispatch a signal to every enabled channel and record deliveries. The
 * (signal_id, channel) unique constraint on alert_deliveries makes recording
 * idempotent, so a re-processed signal never double-sends the same channel.
 */
export async function dispatchAlert(
  signalId: string,
  payload: AlertPayload,
): Promise<AlertResult[]> {
  const supabase = getAdminClient();
  const results: AlertResult[] = [];

  for (const channel of channels) {
    if (!channel.isEnabled()) {
      results.push({ channel: channel.name, status: "skipped", detail: "not configured" });
      continue;
    }

    // Skip if we've already delivered this signal on this channel.
    if (supabase) {
      const { data: existing } = await supabase
        .from("alert_deliveries")
        .select("id")
        .eq("signal_id", signalId)
        .eq("channel", channel.name)
        .maybeSingle();
      if (existing) {
        results.push({ channel: channel.name, status: "skipped", detail: "already delivered" });
        continue;
      }
    }

    const result = await channel.send(payload);
    results.push(result);

    if (supabase) {
      await supabase
        .from("alert_deliveries")
        .upsert(
          {
            signal_id: signalId,
            channel: channel.name,
            status: result.status,
            detail: result.detail ?? null,
          },
          { onConflict: "signal_id,channel" },
        );
    }
  }

  return results;
}
