import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCorrelations,
  getFeedByInfluencer,
  getInfluencer,
  getStats,
  getWalletsForInfluencer,
} from "@/lib/data";
import { Avatar, Badge, Stat, SectionTitle } from "@/components/ui/primitives";
import { SignalCard } from "@/components/signal-card";
import {
  compactNumber,
  formatDuration,
  formatUsd,
  formatUtcTime,
  verificationLabel,
} from "@/lib/format";
import type { VerificationStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InfluencerProfile({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const influencer = await getInfluencer(slug);
  if (!influencer) notFound();

  const [wallets, stats, feed, correlations] = await Promise.all([
    getWalletsForInfluencer(influencer.id),
    getStats(influencer.id),
    getFeedByInfluencer(slug, 60),
    getCorrelations(influencer.id),
  ]);

  const walletActivity = feed.filter(
    (f) => f.signal_type === "wallet_buy" || f.signal_type === "wallet_sell",
  );
  const socialActivity = feed.filter(
    (f) => f.signal_type === "social_mention" || f.signal_type === "correlated",
  );

  return (
    <div className="py-8">
      <Link href="/influencers" className="text-xs text-muted hover:text-signal">
        ← All influencers
      </Link>

      {/* HEADER */}
      <div className="mt-4 flex flex-col gap-5 rounded-2xl border border-ink-700 bg-ink-850 p-6 sm:flex-row sm:items-center">
        <Avatar name={influencer.name} src={influencer.profile_image} size={72} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{influencer.name}</h1>
            <Badge tone="signal" className="!text-[10px]">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-signal" />
              Monitoring
            </Badge>
          </div>
          {influencer.x_handle && (
            <a
              href={`https://x.com/${influencer.x_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm text-muted hover:text-signal"
            >
              @{influencer.x_handle}
            </a>
          )}
          {influencer.description && (
            <p className="mt-2 max-w-2xl text-sm text-muted">{influencer.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted">
            <span>
              <span className="text-fg">{compactNumber(influencer.followers)}</span> followers
            </span>
            <span>
              <span className="text-fg">{wallets.length}</span> tracked wallet
              {wallets.length === 1 ? "" : "s"}
            </span>
            <span>
              Chains: <span className="text-fg">Solana</span>
            </span>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Buys 30D" value={stats.buys_30d} accent="buy" />
        <Stat label="Sells 30D" value={stats.sells_30d} accent="sell" />
        <Stat label="Tokens Bought" value={stats.tokens_bought} />
        <Stat label="Avg Purchase" value={formatUsd(stats.average_purchase_usd)} />
        <Stat label="Social Mentions" value={stats.social_mentions_30d} accent="signal" />
      </div>

      {/* WALLETS */}
      <div className="mt-10">
        <SectionTitle eyebrow="Attribution">Tracked wallets</SectionTitle>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {wallets.map((w) => (
            <div key={w.id} className="rounded-xl border border-ink-700 bg-ink-850 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{w.label ?? "Wallet"}</span>
                <VerificationBadge status={w.verification_status} />
              </div>
              <div className="tabular mt-2 break-all text-xs text-muted">
                {w.address_public ?? w.address_masked}
              </div>
              {w.verification_source && (
                <a
                  href={w.verification_source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-[11px] text-signal/80 hover:text-signal"
                >
                  Attribution source ↗
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CORRELATION: WALLET -> SOCIAL */}
      {correlations.length > 0 && (
        <div className="mt-10">
          <SectionTitle eyebrow="The signal">Wallet → Social</SectionTitle>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Historical public-data presentation — a monitored wallet purchase followed by a
            matching post on X. Not a recommendation to trade.
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {correlations.map((c) => (
              <CorrelationCard key={c.id} item={c} />
            ))}
          </div>
        </div>
      )}

      {/* ACTIVITY COLUMNS */}
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <SectionTitle>Recent wallet activity</SectionTitle>
          <div className="mt-4 flex flex-col gap-3">
            {walletActivity.length ? (
              walletActivity.map((f) => <SignalCard key={f.id} item={f} />)
            ) : (
              <Empty>No wallet activity recorded.</Empty>
            )}
          </div>
        </div>
        <div>
          <SectionTitle>Recent social activity</SectionTitle>
          <div className="mt-4 flex flex-col gap-3">
            {socialActivity.length ? (
              socialActivity.map((f) => <SignalCard key={f.id} item={f} />)
            ) : (
              <Empty>No social activity recorded.</Empty>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CorrelationCard({ item }: { item: Awaited<ReturnType<typeof getCorrelations>>[number] }) {
  const corr = item.correlation!;
  return (
    <div className="rounded-xl border border-signal/25 bg-ink-850 p-4">
      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-signal">${item.token?.symbol}</span>
        <Badge tone="signal">{formatDuration(corr.seconds_between)} gap</Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-faint">Wallet purchase</div>
          <div className="tabular mt-0.5 text-fg">{formatUtcTime(corr.purchase_time)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-faint">X mention</div>
          <div className="tabular mt-0.5 text-fg">
            {item.post ? formatUtcTime(item.post.posted_at) : "—"}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-faint">Mkt cap at purchase</div>
          <div className="tabular mt-0.5 text-fg">
            ${compactNumber(corr.market_cap_at_purchase)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-faint">Time between</div>
          <div className="tabular mt-0.5 font-semibold text-signal">
            {formatDuration(corr.seconds_between)}
          </div>
        </div>
      </div>
      {item.post?.post_url && (
        <a
          href={item.post.post_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-[11px] text-signal/80 hover:text-signal"
        >
          View original post ↗
        </a>
      )}
    </div>
  );
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  const tone =
    status === "verified" || status === "publicly_disclosed"
      ? "verified"
      : status === "community_reported"
        ? "warn"
        : "muted";
  return <Badge tone={tone as any}>{verificationLabel(status)}</Badge>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-ink-700 p-8 text-center text-sm text-muted">
      {children}
    </div>
  );
}
