import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-signal/80">
        404
      </div>
      <h1 className="mt-2 text-2xl font-semibold">Signal not found</h1>
      <p className="mt-2 text-sm text-muted">That page or signal doesn’t exist.</p>
      <Link
        href="/feed"
        className="mt-6 rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-signal-bright"
      >
        Back to live feed
      </Link>
    </div>
  );
}
