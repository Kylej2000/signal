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
              Signal displays publicly available blockchain and social-media activity for
              informational purposes. Wallet attribution may be incomplete or inaccurate.
              Nothing displayed constitutes financial advice.
            </p>
          </div>
          <div className="flex gap-10 text-sm">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wider text-faint">Product</span>
              <Link href="/feed" className="text-muted hover:text-fg">Live Feed</Link>
              <Link href="/influencers" className="text-muted hover:text-fg">Influencers</Link>
              <Link href="/how-it-works" className="text-muted hover:text-fg">How It Works</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wider text-faint">Admin</span>
              <Link href="/admin" className="text-muted hover:text-fg">Admin Panel</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-ink-800 pt-4 text-[11px] text-faint">
          © {new Date().getFullYear()} Signal. Public data only. Not affiliated with any
          person or token shown. Solana-only MVP.
        </div>
      </div>
    </footer>
  );
}
