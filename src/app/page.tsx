import Link from "next/link";
import { LiveFeed } from "@/components/live-feed";
import { getDirectory, getFeed } from "@/lib/data";
import { isDemoMode, hasTelegram } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [buys, directory] = await Promise.all([
    getFeed({ types: ["wallet_buy"], limit: 150 }),
    getDirectory(),
  ]);
  const walletCount = directory.reduce((sum, item) => sum + item.wallet_count, 0);
  const chains = new Set(directory.map((item) => item.primary_chain));
  const last24h = buys.filter((item) => Date.now() - new Date(item.created_at).getTime() <= 86_400_000).length;

  return (
    <div className="py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-signal/80">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-buy" />
            Personal wallet monitor
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Wallet Buy Tracker</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            One feed showing when the wallets you follow buy a crypto token. Newest purchases appear first.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/influencers" className="rounded-lg border border-ink-600 bg-ink-850 px-4 py-2 text-sm text-muted hover:text-fg">View wallets</Link>
          <Link href="/admin" className="rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-signal-bright">Manage tracking</Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Summary label="Tracked people" value={directory.length} />
        <Summary label="Tracked wallets" value={walletCount} />
        <Summary label="Buys detected (24h)" value={last24h} accent />
        <Summary label="Alerts" value={hasTelegram() ? "Telegram on" : "In-app only"} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div><h2 className="text-lg font-semibold">Latest wallet buys</h2><p className="mt-1 text-xs text-faint">{chains.size} active chain{chains.size === 1 ? "" : "s"} · live updates</p></div>
          </div>
          <LiveFeed initialItems={buys} influencers={directory.map((d) => ({ slug: d.slug, name: d.name }))} demo={isDemoMode()} buyOnly />
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-ink-700 bg-ink-850 p-5">
            <h3 className="font-semibold">What each alert shows</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {["Who bought", "Token and amount", "Value at purchase", "Market cap and liquidity", "Chain, DEX and transaction link"].map((item) => <li key={item} className="flex gap-2"><span className="text-buy">✓</span>{item}</li>)}
            </ul>
          </div>
          <div className="rounded-xl border border-warn/25 bg-warn/5 p-5">
            <h3 className="text-sm font-semibold text-warn">Attribution reminder</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">Community-reported wallets may be wrong. Check the attribution source before acting on any alert.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Summary({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return <div className="rounded-xl border border-ink-700 bg-ink-850 p-4"><div className="text-[10px] uppercase tracking-wider text-faint">{label}</div><div className={`mt-2 text-2xl font-semibold tabular ${accent ? "text-buy" : "text-fg"}`}>{value}</div></div>;
}
