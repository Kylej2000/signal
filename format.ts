/** Display formatting helpers. Kept pure so they run on server and client. */

export function maskAddress(addr: string | null | undefined, lead = 4, tail = 4): string {
  if (!addr) return "—";
  if (addr.length <= lead + tail + 1) return addr;
  return `${addr.slice(0, lead)}…${addr.slice(-tail)}`;
}

export function formatUsd(value: number | null | undefined, opts?: { compact?: boolean }): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (opts?.compact) return `$${compactNumber(value)}`;
  if (value < 1) {
    return `$${value.toLocaleString("en-US", { maximumFractionDigits: 6 })}`;
  }
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 100 ? 2 : 0,
  });
}

export function compactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${trim(value / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${trim(value / 1_000_000)}M`;
  if (abs >= 1_000) return `${trim(value / 1_000)}K`;
  return `${trim(value)}`;
}

function trim(n: number): string {
  const r = Math.round(n * 100) / 100;
  return r.toString();
}

export function formatTokenAmount(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (value >= 1_000_000) return `${compactNumber(value)}`;
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (value >= 1) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 4 })}`;
  // sub-dollar prices: show enough significant figures
  return `$${value.toPrecision(3)}`;
}

/** e.g. "2s ago", "12m ago", "3h ago", "4d ago" */
export function timeAgo(iso: string | Date, now: Date = new Date()): string {
  const then = typeof iso === "string" ? new Date(iso) : iso;
  const secs = Math.max(0, Math.round((now.getTime() - then.getTime()) / 1000));
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/** "12m 39s" from a number of seconds. */
export function formatDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined) return "—";
  const s = Math.abs(Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export function formatUtcTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return (
    d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "UTC",
      hour12: false,
    }) + " UTC"
  );
}

export function formatUtcDateTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return (
    d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "UTC",
      hour12: false,
    }) + " UTC"
  );
}

export function verificationLabel(status: string): string {
  switch (status) {
    case "verified":
      return "Verified";
    case "publicly_disclosed":
      return "Publicly Disclosed";
    case "community_reported":
      return "Community Reported";
    default:
      return "Unverified";
  }
}

/** Detection latency badge, e.g. "Detected 5 seconds after transaction". */
export function detectionLatencySeconds(
  blockTs: string,
  detectedTs: string,
): number {
  return Math.max(
    0,
    Math.round((new Date(detectedTs).getTime() - new Date(blockTs).getTime()) / 1000),
  );
}
