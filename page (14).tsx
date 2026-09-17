import { getDirectory, getFeed } from "@/lib/data";
import { LiveFeed } from "@/components/live-feed";
import { isDemoMode } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const [feed, directory] = await Promise.all([getFeed({ limit: 100 }), getDirectory()]);
  const influencers = directory.map((d) => ({ slug: d.slug, name: d.name }));

  return (
    <div className="py-8">
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-signal/80">
          Live Feed
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Signal terminal</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Wallet buys and social mentions from tracked Solana influencers, newest first.
          Correlated events — a wallet buy followed by a matching post — are highlighted.
        </p>
      </div>

      <LiveFeed initialItems={feed} influencers={influencers} demo={isDemoMode()} />
    </div>
  );
}
