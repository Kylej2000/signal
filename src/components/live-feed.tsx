"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FeedItem, SignalType } from "@/lib/types";
import { SignalCard } from "@/components/signal-card";
import { Filters, defaultFilters, type FeedFilterState } from "@/components/filters";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { clsx } from "@/lib/clsx";

function typeFilterToSignals(t: FeedFilterState["type"]): SignalType[] | null {
  switch (t) {
    case "buys":
      return ["wallet_buy"];
    case "sells":
      return ["wallet_sell"];
    case "social":
      return ["social_mention", "correlated"];
    default:
      return null;
  }
}

function passes(item: FeedItem, f: FeedFilterState): boolean {
  const types = typeFilterToSignals(f.type);
  if (types && !types.includes(item.signal_type)) return false;
  if (f.influencerSlug && item.influencer.slug !== f.influencerSlug) return false;

  // Purchase-size / market-cap filters only constrain items that ARE purchases.
  if (item.transaction) {
    if (f.minUsd && (item.transaction.usd_value ?? 0) < f.minUsd) return false;
    if (f.marketCapBucket) {
      const mc = item.transaction.market_cap;
      if (mc === null || mc === undefined) return false;
      if (!inBucket(mc, f.marketCapBucket)) return false;
    }
  }
  return true;
}

function inBucket(mc: number, bucket: FeedFilterState["marketCapBucket"]): boolean {
  switch (bucket) {
    case "u100k":
      return mc < 100_000;
    case "100k-500k":
      return mc >= 100_000 && mc < 500_000;
    case "500k-1m":
      return mc >= 500_000 && mc < 1_000_000;
    case "1m-10m":
      return mc >= 1_000_000 && mc < 10_000_000;
    case "10m+":
      return mc >= 10_000_000;
    default:
      return true;
  }
}

export function LiveFeed({
  initialItems,
  influencers,
  demo,
}: {
  initialItems: FeedItem[];
  influencers: { slug: string; name: string }[];
  demo: boolean;
}) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [filters, setFilters] = useState<FeedFilterState>(defaultFilters);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [live, setLive] = useState(true);
  const seen = useRef<Set<string>>(new Set(initialItems.map((i) => i.id)));

  const prepend = useCallback((incoming: FeedItem) => {
    if (seen.current.has(incoming.id)) return;
    seen.current.add(incoming.id);
    setItems((prev) => [incoming, ...prev].slice(0, 250));
    setNewIds((prev) => new Set(prev).add(incoming.id));
    setTimeout(() => {
      setNewIds((prev) => {
        const next = new Set(prev);
        next.delete(incoming.id);
        return next;
      });
    }, 1500);
  }, []);

  // --- Live mode: subscribe to Supabase realtime inserts on `signals` --------
  useEffect(() => {
    if (demo || !live) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    const channel = supabase
      .channel("signals-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "signals" },
        async (payload: any) => {
          const id = payload.new?.id;
          if (!id) return;
          try {
            const res = await fetch(`/api/signals?id=${id}`, { cache: "no-store" });
            if (!res.ok) return;
            const data = (await res.json()) as { item?: FeedItem };
            if (data.item) prepend(data.item);
          } catch {
            /* ignore */
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [demo, live, prepend]);

  // --- Demo mode: gently simulate incoming signals so the feed feels alive ---
  useEffect(() => {
    if (!demo || !live) return;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const synthetic = makeSyntheticDemoItem(initialItems);
      if (synthetic) prepend(synthetic);
    };
    const id = setInterval(tick, 12_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [demo, live, initialItems, prepend]);

  const visible = useMemo(() => items.filter((i) => passes(i, filters)), [items, filters]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Filters value={filters} onChange={setFilters} influencers={influencers} />
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs text-faint">
          <button
            onClick={() => setLive((l) => !l)}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 transition-colors",
              live
                ? "border-signal/30 bg-signal/10 text-signal"
                : "border-ink-700 bg-ink-800 text-muted",
            )}
          >
            <span
              className={clsx(
                "h-1.5 w-1.5 rounded-full",
                live ? "animate-pulse-dot bg-signal" : "bg-faint",
              )}
            />
            {live ? "Live" : "Paused"}
          </button>
          <span>
            {visible.length} {visible.length === 1 ? "signal" : "signals"}
          </span>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-700 bg-ink-850/40 p-10 text-center text-sm text-muted">
          No signals match these filters yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((item) => (
            <SignalCard key={item.id} item={item} isNew={newIds.has(item.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Builds a fresh synthetic feed item by cloning one of the existing demo buys
 * with a new id, current timestamp and slightly varied values. Clearly flagged
 * as demo. Only used in DEMO_MODE to preview the "new signal enters feed"
 * animation — never represents real activity.
 */
function makeSyntheticDemoItem(pool: FeedItem[]): FeedItem | null {
  const buys = pool.filter((i) => i.signal_type === "wallet_buy" && i.transaction);
  if (!buys.length) return null;
  const base = buys[Math.floor(Math.random() * buys.length)];
  const jitter = 0.7 + Math.random() * 0.9;
  const nowIso = new Date().toISOString();
  const blockIso = new Date(Date.now() - 5000).toISOString();
  const tx = base.transaction!;
  return {
    ...base,
    id: `demo-live-${Date.now()}`,
    created_at: nowIso,
    demo: true,
    transaction: {
      ...tx,
      id: `demo-live-tx-${Date.now()}`,
      usd_value: Math.round((tx.usd_value ?? 500) * jitter),
      token_amount: Math.round((tx.token_amount ?? 100000) * jitter),
      block_timestamp: blockIso,
      detected_at: nowIso,
    },
  };
}
