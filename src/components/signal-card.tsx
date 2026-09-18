"use client";

import Link from "next/link";
import type { FeedItem } from "@/lib/types";
import { Avatar, Badge, ExternalButton } from "@/components/ui/primitives";
import { DemoTag } from "@/components/demo-badge";
import {
  compactNumber,
  detectionLatencySeconds,
  formatDuration,
  formatTokenAmount,
  formatUsd,
  timeAgo,
} from "@/lib/format";
import { useNow } from "@/lib/use-now";
import { clsx } from "@/lib/clsx";
import { chainLabel, transactionUrl } from "@/lib/chains";

export function SignalCard({ item, isNew }: { item: FeedItem; isNew?: boolean }) {
  const now = useNow();
  const isSocial = item.signal_type === "social_mention" || item.signal_type === "correlated";
  return (
    <div className={clsx(isNew && "animate-signal-in")}>
      {isSocial ? (
        <SocialCard item={item} now={now} />
      ) : (
        <BuyCard item={item} now={now} />
      )}
    </div>
  );
}

function CardShell({
  item,
  accent,
  children,
}: {
  item: FeedItem;
  accent: "buy" | "sell" | "signal";
  children: React.ReactNode;
}) {
  const railColor =
    accent === "buy" ? "bg-buy" : accent === "sell" ? "bg-sell" : "bg-signal";
  return (
    <Link
      href={`/signal/${item.id}`}
      className="group relative block overflow-hidden rounded-xl border border-ink-700 bg-ink-850 shadow-card transition-colors hover:border-ink-600"
    >
      <span className={clsx("absolute left-0 top-0 h-full w-0.5", railColor)} />
      <div className="p-4 pl-5">{children}</div>
    </Link>
  );
}

function InfluencerLine({ item }: { item: FeedItem }) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar name={item.influencer.name} src={item.influencer.profile_image} size={34} />
      <div className="leading-tight">
        <div className="text-sm font-semibold text-fg">{item.influencer.name}</div>
        {item.influencer.x_handle && (
          <div className="text-xs text-faint">@{item.influencer.x_handle}</div>
        )}
      </div>
    </div>
  );
}

function BuyCard({ item, now }: { item: FeedItem; now: Date }) {
  const tx = item.transaction!;
  const isBuy = tx.transaction_type === "buy";
  const latency = detectionLatencySeconds(tx.block_timestamp, tx.detected_at);
  return (
    <CardShell item={item} accent={isBuy ? "buy" : "sell"}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge tone={isBuy ? "buy" : "sell"}>
            <span className="text-sm leading-none">{isBuy ? "▲" : "▼"}</span>
            {isBuy ? "Buy" : "Sell"}
          </Badge>
          <InfluencerLine item={item} />
        </div>
        <div className="flex items-center gap-2 text-right">
          {item.demo && <DemoTag />}
          <span className="tabular text-xs text-faint">{timeAgo(item.created_at, now)}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-sm text-muted">{isBuy ? "Bought" : "Sold"}</span>
        <span className="tabular text-base font-semibold text-fg">
          {formatTokenAmount(tx.token_amount)}
        </span>
        <span className="text-base font-bold text-signal">${item.token?.symbol}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label="Value" value={formatUsd(tx.usd_value)} accent={isBuy ? "buy" : "sell"} />
        <MiniStat label="Mkt cap" value={`$${compactNumber(tx.market_cap)}`} />
        <MiniStat label="Liquidity" value={`$${compactNumber(tx.liquidity)}`} />
        <MiniStat label="DEX" value={tx.dex ?? "—"} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge tone="muted">{chainLabel(tx.chain)}</Badge>
          {tx.wallet_address_masked && (
            <span className="tabular text-[11px] text-faint">{tx.wallet_address_masked}</span>
          )}
          <span className="text-[11px] text-faint">· detected {latency}s after tx</span>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
          <ExternalButton href={transactionUrl(tx.chain, tx.transaction_hash)}>
            Transaction
          </ExternalButton>
          {item.token?.dexscreener_url && (
            <ExternalButton href={item.token.dexscreener_url} primary>
              DexScreener
            </ExternalButton>
          )}
        </div>
      </div>
    </CardShell>
  );
}

function SocialCard({ item, now }: { item: FeedItem; now: Date }) {
  const post = item.post!;
  const corr = item.correlation;
  return (
    <CardShell item={item} accent="signal">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge tone="signal">
            <span className="font-bold">𝕏</span> Mention
          </Badge>
          <InfluencerLine item={item} />
        </div>
        <div className="flex items-center gap-2 text-right">
          {item.demo && <DemoTag />}
          <span className="tabular text-xs text-faint">{timeAgo(item.created_at, now)}</span>
        </div>
      </div>

      <div className="mt-3 text-sm text-muted">
        Mentioned <span className="font-bold text-signal">${item.token?.symbol}</span>
      </div>

      {post.content && (
        <blockquote className="mt-2 border-l-2 border-ink-600 pl-3 text-sm italic leading-relaxed text-fg/90">
          “{post.content}”
        </blockquote>
      )}

      {corr && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-signal/25 bg-signal/5 px-3 py-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-signal">
            <path d="M13 7l5 5-5 5M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xs text-signal">
            Wallet bought{" "}
            <span className="font-semibold">{formatDuration(corr.seconds_between)}</span> before
            this post
          </span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-end" onClick={(e) => e.preventDefault()}>
        {post.post_url && (
          <ExternalButton href={post.post_url} primary>
            View Post
          </ExternalButton>
        )}
      </div>
    </CardShell>
  );
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: "buy" | "sell";
}) {
  return (
    <div className="rounded-md border border-ink-700 bg-ink-800 px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-faint">{label}</div>
      <div
        className={clsx(
          "tabular mt-0.5 text-sm font-medium",
          accent === "buy" && "text-buy",
          accent === "sell" && "text-sell",
          !accent && "text-fg",
        )}
      >
        {value}
      </div>
    </div>
  );
}
