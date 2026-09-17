import Link from "next/link";
import { CTAButton, Badge, ExternalButton } from "@/components/ui/primitives";
import { getFeed } from "@/lib/data";
import { SignalCard } from "@/components/signal-card";
import { compactNumber } from "@/lib/format";

export default async function HomePage() {
  const feed = await getFeed({ limit: 4 });
  const preview = feed.find((f) => f.signal_type === "wallet_buy") ?? feed[0];

  return (
    <div className="py-14 sm:py-20">
      {/* HERO */}
      <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-850 px-3 py-1 text-xs text-muted">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-signal" />
            Real-time Solana intelligence
          </div>
          <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Know When They Buy.
            <br />
            <span className="text-signal">Before They Post.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Real-time alerts when tracked crypto influencers buy tokens from publicly
            identified wallets — and when they mention them on X.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <CTAButton href="/feed">View Live Signals</CTAButton>
            <CTAButton href="/influencers" variant="ghost">
              Explore Influencers
            </CTAButton>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
            <HeroStat value="~5s" label="Detection latency" />
            <HeroStat value="Solana" label="Chain (MVP)" />
            <HeroStat value="Wallet + X" label="Two data streams" />
          </dl>
        </div>

        {/* LIVE ALERT PREVIEW */}
        <div className="relative">
          <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-signal/5 blur-2xl" />
          {preview ? (
            <HeroAlertPreview item={preview} />
          ) : (
            <div className="rounded-xl border border-ink-700 bg-ink-850 p-6 text-sm text-muted">
              No signals yet.
            </div>
          )}
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="mt-24 grid gap-4 md:grid-cols-3">
        <FeatureCard
          title="Public wallet buys"
          body="Monitor publicly identified Solana wallets. Get alerted the moment a tracked wallet swaps SOL or a stablecoin for a token — not on every incoming transfer."
          icon="wallet"
        />
        <FeatureCard
          title="Social mentions"
          body="Watch tracked X accounts for cashtags, contract addresses and DexScreener links — with confidence scoring so ambiguous tickers don't create noise."
          icon="social"
        />
        <FeatureCard
          title="Wallet → social correlation"
          body="The signal that matters: when a wallet buys a token and the same influencer posts about it minutes later, we surface the exact time gap."
          icon="link"
          highlight
        />
      </section>

      {/* HOW IT WORKS TEASER */}
      <section className="mt-20 rounded-2xl border border-ink-700 bg-ink-850/60 p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-signal/80">
              The pipeline
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Public wallet → buy detected → enriched → live signal
            </h2>
            <p className="mt-3 text-sm text-muted">
              Signal reads only public blockchain and social data. It never executes trades,
              never touches your wallet, and never asks for keys.
            </p>
          </div>
          <CTAButton href="/how-it-works" variant="ghost">
            How it works →
          </CTAButton>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-2 text-xs text-muted">
          {[
            "Tracked wallet",
            "Helius stream",
            "Swap parser",
            "Token enrichment",
            "Database",
            "Signal",
            "Alert",
          ].map((step, i, arr) => (
            <span key={step} className="flex items-center gap-2">
              <span className="rounded-md border border-ink-700 bg-ink-900 px-2.5 py-1 tabular">
                {step}
              </span>
              {i < arr.length - 1 && <span className="text-signal/50">→</span>}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dd className="tabular text-2xl font-semibold text-fg">{value}</dd>
      <dt className="mt-0.5 text-xs text-faint">{label}</dt>
    </div>
  );
}

function HeroAlertPreview({ item }: { item: Awaited<ReturnType<typeof getFeed>>[number] }) {
  const tx = item.transaction;
  return (
    <div className="relative rounded-2xl border border-signal/25 bg-ink-850 p-5 shadow-glow">
      <div className="flex items-center justify-between">
        <Badge tone="buy">
          <span className="leading-none">▲</span> Buy Alert
        </Badge>
        <Badge tone="signal" className="!text-[10px]">
          Detected 5 seconds after transaction
        </Badge>
      </div>

      <div className="mt-4">
        <div className="text-lg font-semibold">{item.influencer.name}</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-sm text-muted">Bought</span>
          <span className="tabular text-lg font-semibold">
            {tx?.token_amount ? tx.token_amount.toLocaleString("en-US") : "—"}
          </span>
          <span className="text-lg font-bold text-signal">{item.token?.symbol}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <PreviewField label="Value" value={tx?.usd_value ? `$${tx.usd_value.toLocaleString()}` : "—"} />
        <PreviewField label="Market Cap at Buy" value={`$${compactNumber(tx?.market_cap)}`} />
        <PreviewField label="Chain" value="Solana" />
        <PreviewField label="DEX" value={tx?.dex ?? "—"} />
        <PreviewField label="Wallet" value={tx?.wallet_address_masked ?? "—"} mono />
        <PreviewField label="Liquidity" value={`$${compactNumber(tx?.liquidity)}`} />
      </div>

      <div className="mt-5 flex items-center gap-2">
        <ExternalButton
          href={tx ? `https://solscan.io/tx/${tx.transaction_hash}` : "#"}
          primary
        >
          View Transaction
        </ExternalButton>
        {item.token?.dexscreener_url && (
          <ExternalButton href={item.token.dexscreener_url}>View Token</ExternalButton>
        )}
        <Link
          href={`/signal/${item.id}`}
          className="ml-auto text-xs text-muted hover:text-signal"
        >
          Open signal →
        </Link>
      </div>

      {item.demo && (
        <div className="mt-4 rounded-md border border-warn/20 bg-warn/5 px-3 py-2 text-[11px] text-warn/80">
          Sample data — this does not represent a real transaction.
        </div>
      )}
    </div>
  );
}

function PreviewField({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-800 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-faint">{label}</div>
      <div className={`mt-0.5 font-medium text-fg ${mono ? "tabular" : ""}`}>{value}</div>
    </div>
  );
}

function FeatureCard({
  title,
  body,
  icon,
  highlight,
}: {
  title: string;
  body: string;
  icon: "wallet" | "social" | "link";
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        highlight ? "border-signal/30 bg-signal/5" : "border-ink-700 bg-ink-850"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
          highlight ? "bg-signal/15 text-signal" : "bg-ink-800 text-muted"
        }`}
      >
        <Icon name={icon} />
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function Icon({ name }: { name: "wallet" | "social" | "link" }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none" } as const;
  if (name === "wallet")
    return (
      <svg {...common}>
        <path d="M3 7a2 2 0 012-2h12a2 2 0 012 2v1M3 7v10a2 2 0 002 2h13a1 1 0 001-1v-3M3 7h15m3 4h-4a2 2 0 000 4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (name === "social")
    return (
      <svg {...common}>
        <path d="M4 4l7.5 9.5M4 20l6-6m10 6l-7.5-9.5M20 4l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M9 15l6-6M10 6l1-1a4 4 0 015.7 5.7l-1 1M14 18l-1 1A4 4 0 017.3 13.3l1-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
