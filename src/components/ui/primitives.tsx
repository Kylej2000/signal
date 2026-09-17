import Link from "next/link";
import { clsx } from "@/lib/clsx";

export function Card({
  className,
  children,
  glow,
}: {
  className?: string;
  children: React.ReactNode;
  glow?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-ink-700 bg-ink-850 shadow-card",
        glow && "shadow-glow border-signal/30",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: "buy" | "sell" | "signal";
}) {
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-800 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-faint">{label}</div>
      <div
        className={clsx(
          "tabular mt-1 text-xl font-semibold",
          accent === "buy" && "text-buy",
          accent === "sell" && "text-sell",
          accent === "signal" && "text-signal",
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

type BadgeTone = "buy" | "sell" | "signal" | "neutral" | "warn" | "verified" | "muted";

const toneClasses: Record<BadgeTone, string> = {
  buy: "bg-buy/10 text-buy border-buy/30",
  sell: "bg-sell/10 text-sell border-sell/30",
  signal: "bg-signal/10 text-signal border-signal/30",
  warn: "bg-warn/10 text-warn border-warn/30",
  verified: "bg-signal/10 text-signal border-signal/30",
  neutral: "bg-ink-700 text-fg border-ink-600",
  muted: "bg-ink-800 text-muted border-ink-700",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ExternalButton({
  href,
  children,
  primary,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
        primary
          ? "border-signal/40 bg-signal/10 text-signal hover:bg-signal/20"
          : "border-ink-600 bg-ink-800 text-muted hover:border-ink-600 hover:text-fg",
      )}
    >
      {children}
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M7 17L17 7M17 7H8M17 7V16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}

export function CTAButton({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all",
        variant === "primary"
          ? "bg-signal text-ink-950 hover:bg-signal-bright"
          : "border border-ink-600 bg-ink-800/60 text-fg hover:border-signal/40 hover:text-signal",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function SectionTitle({
  children,
  eyebrow,
  className,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {eyebrow && (
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-signal/80">
          {eyebrow}
        </div>
      )}
      <h2 className="mt-1 text-xl font-semibold tracking-tight text-fg">{children}</h2>
    </div>
  );
}

export function Avatar({
  name,
  src,
  size = 40,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full border border-ink-600 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border border-ink-600 bg-gradient-to-br from-ink-700 to-ink-800 text-xs font-semibold text-muted"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {initials}
    </div>
  );
}
