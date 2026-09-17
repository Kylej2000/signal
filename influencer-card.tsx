import Link from "next/link";
import type { InfluencerDirectoryEntry } from "@/lib/types";
import { Avatar, Badge } from "@/components/ui/primitives";
import { compactNumber, timeAgo } from "@/lib/format";

export function InfluencerCard({ entry }: { entry: InfluencerDirectoryEntry }) {
  return (
    <Link
      href={`/influencer/${entry.slug}`}
      className="group flex flex-col rounded-xl border border-ink-700 bg-ink-850 p-4 shadow-card transition-colors hover:border-signal/40"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={entry.name} src={entry.profile_image} size={44} />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-fg">{entry.name}</div>
            {entry.x_handle && <div className="text-xs text-faint">@{entry.x_handle}</div>}
          </div>
        </div>
        <Badge tone="signal" className="!text-[10px]">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-signal" />
          Monitoring
        </Badge>
      </div>

      {entry.category && (
        <div className="mt-3">
          <Badge tone="muted">{entry.category}</Badge>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <Field label="Chain" value="Solana" />
        <Field
          label="Public Wallets"
          value={`${entry.verified_wallet_count}/${entry.wallet_count} attributed`}
        />
        <Field
          label="Followers"
          value={entry.followers ? compactNumber(entry.followers) : "—"}
        />
        <Field
          label="Last Activity"
          value={entry.last_activity ? timeAgo(entry.last_activity) : "—"}
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-ink-800 pt-3">
        <span className="text-xs text-faint">View profile</span>
        <span className="text-signal transition-transform group-hover:translate-x-0.5">→</span>
      </div>
    </Link>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-faint">{label}</div>
      <div className="tabular mt-0.5 font-medium text-fg">{value}</div>
    </div>
  );
}
