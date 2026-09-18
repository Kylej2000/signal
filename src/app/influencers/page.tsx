import { getDirectory } from "@/lib/data";
import { InfluencerCard } from "@/components/influencer-card";

export const dynamic = "force-dynamic";

export default async function InfluencersPage() {
  const directory = await getDirectory();

  return (
    <div className="py-8">
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-signal/80">
          Wallet list
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Tracked people and wallets</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          The wallets included in your personal buy monitor. Attribution status shows how
          confidently each wallet is connected to the named person.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {directory.map((entry) => (
          <InfluencerCard key={entry.id} entry={entry} />
        ))}
      </div>

      {directory.length === 0 && (
        <div className="rounded-xl border border-dashed border-ink-700 p-10 text-center text-sm text-muted">
          No influencers configured yet. Add some in the{" "}
          <a href="/admin" className="text-signal">admin panel</a>.
        </div>
      )}
    </div>
  );
}
