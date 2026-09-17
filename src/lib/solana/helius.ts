/**
 * Helius integration helpers.
 * -----------------------------------------------------------------------------
 * - Webhook authentication (shared-secret in the Authorization header).
 * - Keeping the Helius webhook's monitored-address list in sync with the
 *   `wallets` table.
 *
 * All functions are safe to call without credentials (they no-op / return
 * false) so the app runs in demo mode.
 */

import { config, hasHelius } from "@/lib/config";

const HELIUS_API = "https://api.helius.xyz/v0";

/**
 * Verify an incoming Helius webhook request.
 *
 * Helius lets you set an arbitrary "Authorization" header value on the webhook.
 * We compare it (constant-time) against HELIUS_WEBHOOK_SECRET. If no secret is
 * configured we FAIL CLOSED in production but allow in demo/dev so local
 * testing works — controlled by the `allowUnsecuredInDev` flag.
 */
export function verifyHeliusRequest(
  authHeader: string | null,
  { allowUnsecuredInDev = true }: { allowUnsecuredInDev?: boolean } = {},
): boolean {
  const secret = config.heliusWebhookSecret;
  if (!secret) {
    // No secret set. Allow only outside production to enable local testing.
    return allowUnsecuredInDev && process.env.NODE_ENV !== "production";
  }
  if (!authHeader) return false;
  return timingSafeEqual(authHeader, secret);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/**
 * Sync the monitored-address list on an existing Helius webhook so it matches
 * the currently active, attributed wallets. Called from the admin API after a
 * wallet is added / removed / toggled.
 *
 * Returns { ok, synced } — never throws to the caller.
 */
export async function syncHeliusWatchlist(addresses: string[]): Promise<{
  ok: boolean;
  message: string;
}> {
  if (!hasHelius() || !config.heliusWebhookId) {
    return { ok: false, message: "Helius not configured — watchlist not synced." };
  }
  try {
    const url = `${HELIUS_API}/webhooks/${config.heliusWebhookId}?api-key=${config.heliusApiKey}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accountAddresses: addresses }),
    });
    if (!res.ok) {
      return { ok: false, message: `Helius sync failed: ${res.status}` };
    }
    return { ok: true, message: `Synced ${addresses.length} addresses to Helius.` };
  } catch (e) {
    return { ok: false, message: `Helius sync error: ${(e as Error).message}` };
  }
}

/**
 * Convenience: create a Helius "enhanced" webhook pointed at this app.
 * Not called automatically — documented in SETUP.md for one-time setup.
 */
export async function createHeliusWebhook(
  webhookUrl: string,
  addresses: string[],
): Promise<{ ok: boolean; webhookId?: string; message: string }> {
  if (!hasHelius()) return { ok: false, message: "HELIUS_API_KEY not set." };
  try {
    const res = await fetch(`${HELIUS_API}/webhooks?api-key=${config.heliusApiKey}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        webhookURL: webhookUrl,
        transactionTypes: ["SWAP", "TRANSFER", "ANY"],
        accountAddresses: addresses,
        webhookType: "enhanced",
        authHeader: config.heliusWebhookSecret ?? undefined,
      }),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, message: `Failed: ${JSON.stringify(json)}` };
    return { ok: true, webhookId: json.webhookID, message: "Webhook created." };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}
