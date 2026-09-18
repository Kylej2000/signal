"use client";

import { clsx } from "@/lib/clsx";

export interface FeedFilterState {
  type: "all" | "buys" | "sells" | "social";
  influencerSlug: string;
  minUsd: number;
  marketCapBucket: "" | "u100k" | "100k-500k" | "500k-1m" | "1m-10m" | "10m+";
}

export const defaultFilters: FeedFilterState = {
  type: "all",
  influencerSlug: "",
  minUsd: 0,
  marketCapBucket: "",
};

const typeTabs: { key: FeedFilterState["type"]; label: string }[] = [
  { key: "all", label: "All" },
  { key: "buys", label: "Buys" },
  { key: "sells", label: "Sells" },
  { key: "social", label: "Social" },
];

const minUsdOptions = [
  { value: 0, label: "Any" },
  { value: 100, label: "$100+" },
  { value: 500, label: "$500+" },
  { value: 1000, label: "$1K+" },
  { value: 5000, label: "$5K+" },
];

const mcOptions: { value: FeedFilterState["marketCapBucket"]; label: string }[] = [
  { value: "", label: "Any market cap" },
  { value: "u100k", label: "Under $100K" },
  { value: "100k-500k", label: "$100K–$500K" },
  { value: "500k-1m", label: "$500K–$1M" },
  { value: "1m-10m", label: "$1M–$10M" },
  { value: "10m+", label: "$10M+" },
];

export function Filters({
  value,
  onChange,
  influencers,
  showTypes = true,
}: {
  value: FeedFilterState;
  onChange: (next: FeedFilterState) => void;
  influencers: { slug: string; name: string }[];
  showTypes?: boolean;
}) {
  const set = (patch: Partial<FeedFilterState>) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-ink-700 bg-ink-850/60 p-3 lg:flex-row lg:items-center lg:justify-between">
      {showTypes && <div className="inline-flex rounded-lg border border-ink-700 bg-ink-900 p-0.5">
        {typeTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => set({ type: t.key })}
            className={clsx(
              "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
              value.type === t.key
                ? "bg-signal text-ink-950"
                : "text-muted hover:text-fg",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>}

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={value.influencerSlug}
          onChange={(v) => set({ influencerSlug: v })}
          ariaLabel="Influencer"
        >
          <option value="">All influencers</option>
          {influencers.map((i) => (
            <option key={i.slug} value={i.slug}>
              {i.name}
            </option>
          ))}
        </Select>

        <Select
          value={String(value.minUsd)}
          onChange={(v) => set({ minUsd: Number(v) })}
          ariaLabel="Minimum purchase"
        >
          {minUsdOptions.map((o) => (
            <option key={o.value} value={o.value}>
              Min {o.label}
            </option>
          ))}
        </Select>

        <Select
          value={value.marketCapBucket}
          onChange={(v) => set({ marketCapBucket: v as FeedFilterState["marketCapBucket"] })}
          ariaLabel="Market cap"
        >
          {mcOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-ink-700 bg-ink-900 px-3 py-1.5 text-sm text-fg outline-none transition-colors hover:border-ink-600 focus:border-signal/50"
    >
      {children}
    </select>
  );
}
