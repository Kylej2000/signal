import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-ink-800">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-signal" />
              <span className="text-sm font-bold uppercase tracking-[0.28em]">Signal</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-faint">
              Personal monitoring dashboard for publicly visible blockchain activity.
              Wallet attribution may be incomplete or inaccurate. Nothing displayed is financial advice.
            </p>
          </div>
          <div className="flex gap-10 text-sm">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wider text-faint">Shortcuts</span>
              <Link href="/" className="text-muted hover:text-fg">Wallet Buy Feed</Link>
              <Link href="/influencers" className="text-muted hover:text-fg">Tracked Wallets</Link>
              <Link href="/admin" className="text-muted hover:text-fg">Manage Tracking</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-ink-800 pt-4 text-[11px] text-faint">
          © {new Date().getFullYear()} Signal. Public data only. Not affiliated with any
          person, wallet, chain or token shown. Monitoring is best-effort.
        </div>
      </div>
    </footer>
  );
}
