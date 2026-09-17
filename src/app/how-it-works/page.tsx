import { CTAButton } from "@/components/ui/primitives";

export default function HowItWorks() {
  return (
    <div className="py-10">
      <div className="max-w-3xl">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-signal/80">
          How it works
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Publicly observable activity, surfaced fast.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Signal is an intelligence and alerting dashboard. It reads only public blockchain
          and public social-media data, and presents it as clearly and quickly as possible.
          It does <span className="text-fg">not</span> execute trades, copy trade, or touch
          your wallet — and it never asks for a seed phrase or private key.
        </p>
      </div>

      {/* Pipeline A */}
      <Section
        eyebrow="Pipeline A — Wallet"
        title="Public wallet → buy detected → live signal"
        steps={[
          ["Tracked wallet", "A public blockchain address attributed to an influencer, stored with its chain and verification status."],
          ["Helius stream", "Helius webhooks push transactions for monitored addresses to Signal in near real-time."],
          ["Swap parser", "We detect swaps where the wallet exchanges SOL / USDC / USDT for an SPL token — not ordinary transfers."],
          ["Token enrichment", "The received token is enriched via DexScreener / Birdeye: name, ticker, price, market cap, liquidity."],
          ["Snapshot", "We store the price, market cap and liquidity at the transaction time — not just the current values."],
          ["Signal + alert", "An idempotent signal is created (one per transaction) and pushed to in-app and configured alert channels."],
        ]}
      />

      {/* Pipeline B */}
      <Section
        eyebrow="Pipeline B — Social"
        title="X post → token identified → correlated alert"
        steps={[
          ["Monitored account", "Only public posts from tracked influencer X accounts are read."],
          ["Extraction", "We extract cashtags, token symbols, contract addresses and DexScreener links from each post."],
          ["Confidence scoring", "Matches are scored HIGH / MEDIUM / LOW. Ambiguous tickers alone don't confirm a specific token."],
          ["Correlation", "If a high-confidence mention matches a token a monitored wallet already bought, we correlate them."],
          ["Time gap", "We compute the exact time between the wallet purchase and the public post — the core signal."],
        ]}
      />

      {/* Data quality */}
      <section className="mt-16 rounded-2xl border border-ink-700 bg-ink-850 p-6">
        <h2 className="text-xl font-semibold">Wallet attribution is a data-quality problem</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          We never claim an influencer owns a wallet just because an address was entered.
          Every wallet carries an attribution status:
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Verified", "Attribution confirmed by Signal."],
            ["Publicly Disclosed", "The influencer publicly disclosed the address."],
            ["Community Reported", "Reported by the community, not confirmed."],
            ["Unverified", "No attribution evidence."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl border border-ink-700 bg-ink-800 p-4">
              <div className="text-sm font-semibold text-fg">{t}</div>
              <div className="mt-1 text-xs text-muted">{d}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-faint">
          Only <span className="text-fg">Verified</span> and{" "}
          <span className="text-fg">Publicly Disclosed</span> wallets generate normal
          production alerts by default.
        </p>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <CTAButton href="/feed">View live signals</CTAButton>
        <CTAButton href="/influencers" variant="ghost">
          Explore influencers
        </CTAButton>
      </div>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  steps,
}: {
  eyebrow: string;
  title: string;
  steps: [string, string][];
}) {
  return (
    <section className="mt-16">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-signal/80">
        {eyebrow}
      </div>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
      <ol className="mt-6 space-y-3">
        {steps.map(([t, d], i) => (
          <li key={t} className="flex gap-4 rounded-xl border border-ink-700 bg-ink-850 p-4">
            <span className="tabular flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-signal/30 bg-signal/10 text-sm font-semibold text-signal">
              {i + 1}
            </span>
            <div>
              <div className="text-sm font-semibold text-fg">{t}</div>
              <div className="mt-0.5 text-sm text-muted">{d}</div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
