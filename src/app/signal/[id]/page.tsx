import { notFound } from "next/navigation";
import Link from "next/link";
import { getFeedItem } from "@/lib/data";
import { Avatar, Badge, ExternalButton } from "@/components/ui/primitives";
import { DemoTag } from "@/components/demo-badge";
import {
  compactNumber,
  detectionLatencySeconds,
  formatDuration,
  formatPrice,
  formatTokenAmount,
  formatUsd,
  formatUtcDateTime,
  timeAgo,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SignalDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getFeedItem(id);
  if (!item) notFound();

  const isBuySell =
    item.signal_type === "wallet_buy" || item.signal_type === "wallet_sell";
  const tx = item.transaction;

  return (
    <div className="py-8">
      <Link href="/feed" className="text-xs text-muted hover:text-signal">
        ← Back to feed
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* MAIN */}
        <div className="rounded-2xl border border-ink-700 bg-ink-850 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={item.influencer.name} src={item.influencer.profile_image} size={44} />
              <div>
                <Link
                  href={`/influencer/${item.influencer.slug}`}
                  className="text-base font-semibold hover:text-signal"
                >
                  {item.influencer.name}
                </Link>
                {item.influencer.x_handle && (
                  <div className="text-xs text-faint">@{item.influencer.x_handle}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {item.demo && <DemoTag />}
              {isBuySell ? (
                <Badge tone={tx?.transaction_type === "sell" ? "sell" : "buy"}>
                  {tx?.transaction_type === "sell" ? "▼ Sell" : "▲ Buy"}
                </Badge>
              ) : (
                <Badge tone="signal">𝕏 Mention</Badge>
              )}
            </div>
          </div>

          {/* Token identity */}
          <div className="mt-6 flex items-center gap-4 rounded-xl border border-ink-700 bg-ink-800 p-4">
            <Avatar name={item.token?.symbol ?? "?"} src={item.token?.image_url} size={48} />
            <div>
              <div className="text-xl font-bold text-signal">${item.token?.symbol}</div>
              <div className="text-sm text-muted">{item.token?.name}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[10px] uppercase tracking-wider text-faint">Contract</div>
              <div className="tabular mt-0.5 break-all text-xs text-muted">
                {item.token?.contract_address}
              </div>
            </div>
          </div>

          {/* Detail grid */}
          {isBuySell && tx ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Detail label="Purchase (USD)" value={formatUsd(tx.usd_value)} accent="buy" />
              <Detail label="Tokens received" value={formatTokenAmount(tx.token_amount)} />
              <Detail label="SOL spent" value={tx.sol_amount ? `${tx.sol_amount} SOL` : "—"} />
              <Detail label="Market cap at tx" value={`$${compactNumber(tx.market_cap)}`} />
              <Detail label="Liquidity at tx" value={`$${compactNumber(tx.liquidity)}`} />
              <Detail label="Price at tx" value={formatPrice(tx.token_price)} />
              <Detail label="DEX" value={tx.dex ?? "—"} />
              <Detail label="Blockchain" value="Solana" />
              <Detail
                label="Wallet"
                value={tx.wallet_address_masked ?? "Unattributed"}
                mono
              />
            </div>
          ) : (
            item.post && (
              <div className="mt-6">
                <div className="text-[10px] uppercase tracking-wider text-faint">Post</div>
                <blockquote className="mt-2 rounded-xl border border-ink-700 bg-ink-800 p-4 text-sm italic leading-relaxed text-fg/90">
                  “{item.post.content}”
                </blockquote>
              </div>
            )
          )}

          {/* Timestamps + hash */}
          {isBuySell && tx && (
            <div className="mt-6 space-y-2 rounded-xl border border-ink-700 bg-ink-800 p-4 text-sm">
              <Row label="Transaction hash" value={tx.transaction_hash} mono />
              <Row label="Block time" value={formatUtcDateTime(tx.block_timestamp)} />
              <Row label="Detected at" value={formatUtcDateTime(tx.detected_at)} />
              <Row
                label="Detection latency"
                value={`${detectionLatencySeconds(tx.block_timestamp, tx.detected_at)}s after confirmation`}
              />
              {tx.price_source && (
                <Row
                  label="Price source"
                  value={priceSourceLabel(tx.price_source)}
                />
              )}
            </div>
          )}

          {/* External actions */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {isBuySell && tx && (
              <ExternalButton href={`https://solscan.io/tx/${tx.transaction_hash}`} primary>
                View Transaction
              </ExternalButton>
            )}
            {item.token?.dexscreener_url && (
              <ExternalButton href={item.token.dexscreener_url}>DexScreener</ExternalButton>
            )}
            {item.post?.post_url && (
              <ExternalButton href={item.post.post_url} primary>
                View Post
              </ExternalButton>
            )}
          </div>
        </div>

        {/* SIDE: SOCIAL ACTIVITY / CORRELATION */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-ink-700 bg-ink-850 p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-signal/80">
              Social activity
            </div>
            {item.correlation ? (
              <div className="mt-3">
                <div className="flex items-center gap-2 rounded-lg border border-signal/25 bg-signal/5 px-3 py-2 text-sm text-signal">
                  <span className="font-semibold">X mention detected</span>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <Row
                    label="Time after purchase"
                    value={formatDuration(item.correlation.seconds_between)}
                    highlight
                  />
                  <Row
                    label="Mkt cap at purchase"
                    value={`$${compactNumber(item.correlation.market_cap_at_purchase)}`}
                  />
                </div>
                {item.post?.post_url && (
                  <a
                    href={item.post.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-[11px] text-signal/80 hover:text-signal"
                  >
                    View original public post ↗
                  </a>
                )}
              </div>
            ) : isBuySell ? (
              <p className="mt-3 text-sm text-muted">
                No matching post from this influencer detected yet. If they mention this token
                on X, a correlated social alert will appear here.
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted">
                This is a standalone social mention with no correlated wallet purchase from a
                monitored wallet.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-ink-700 bg-ink-850 p-5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">Signal type</span>
              <span className="font-medium capitalize">
                {item.signal_type.replace("_", " ")}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted">Created</span>
              <span className="tabular">{timeAgo(item.created_at)}</span>
            </div>
          </div>

          <p className="rounded-xl border border-ink-800 bg-ink-900 p-4 text-[11px] leading-relaxed text-faint">
            Public blockchain and social data, shown for informational purposes. Wallet
            attribution may be incomplete or inaccurate. Nothing here constitutes financial
            advice.
          </p>
        </div>
      </div>
    </div>
  );
}

function priceSourceLabel(src: string): string {
  switch (src) {
    case "birdeye_historical":
      return "Birdeye (historical snapshot)";
    case "dexscreener_current":
      return "DexScreener (current — estimate)";
    case "estimate":
      return "Estimate";
    default:
      return src;
  }
}

function Detail({
  label,
  value,
  accent,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  accent?: "buy" | "sell";
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-800 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-faint">{label}</div>
      <div
        className={`mt-0.5 font-semibold ${mono ? "tabular text-sm" : "text-base"} ${
          accent === "buy" ? "text-buy" : accent === "sell" ? "text-sell" : "text-fg"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span
        className={`text-right ${mono ? "tabular break-all text-xs" : ""} ${
          highlight ? "font-semibold text-signal" : "text-fg"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
