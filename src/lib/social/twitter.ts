/**
 * X / Twitter monitoring abstraction.
 * -----------------------------------------------------------------------------
 * Reads ONLY public posts from tracked influencer accounts. Implemented against
 * the X API v2 (app-only bearer token). If no token is configured, the client
 * is disabled and the poller no-ops, so the rest of the app keeps working.
 *
 * The interface is deliberately thin so it can be swapped for a different data
 * source (a scraper, a third-party firehose) without touching the ingest logic.
 */

import { config, hasX } from "@/lib/config";

export interface PublicPost {
  post_id: string;
  content: string;
  posted_at: string; // ISO
  url: string;
}

export interface XClient {
  isEnabled(): boolean;
  /** Resolve a handle (without @) to a numeric user id. */
  getUserId(handle: string): Promise<string | null>;
  /** Recent public posts for a user id, newest first. */
  getRecentPosts(userId: string, sinceId?: string): Promise<PublicPost[]>;
}

const API = "https://api.twitter.com/2";

function authHeaders() {
  return { authorization: `Bearer ${config.xBearerToken}` };
}

export const xClient: XClient = {
  isEnabled: () => hasX(),

  async getUserId(handle: string): Promise<string | null> {
    if (!hasX()) return null;
    try {
      const res = await fetch(`${API}/users/by/username/${encodeURIComponent(handle)}`, {
        headers: authHeaders(),
      });
      if (!res.ok) return null;
      const json = (await res.json()) as any;
      return json?.data?.id ?? null;
    } catch {
      return null;
    }
  },

  async getRecentPosts(userId: string, sinceId?: string): Promise<PublicPost[]> {
    if (!hasX()) return [];
    try {
      const params = new URLSearchParams({
        max_results: "10",
        "tweet.fields": "created_at,text",
        exclude: "retweets,replies",
      });
      if (sinceId) params.set("since_id", sinceId);
      const res = await fetch(`${API}/users/${userId}/tweets?${params.toString()}`, {
        headers: authHeaders(),
      });
      if (!res.ok) return [];
      const json = (await res.json()) as any;
      const tweets: any[] = json?.data ?? [];
      return tweets.map((t) => ({
        post_id: t.id,
        content: t.text,
        posted_at: t.created_at ?? new Date().toISOString(),
        url: `https://x.com/i/web/status/${t.id}`,
      }));
    } catch {
      return [];
    }
  },
};
