import { Badge } from "@/components/ui/primitives";

/** Top-of-page banner shown whenever the app is running on demo data. */
export function DemoBanner() {
  return (
    <div className="border-b border-warn/20 bg-warn/5">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-4 py-1.5 text-[11px] text-warn/90 sm:px-6">
        <span className="h-1.5 w-1.5 rounded-full bg-warn" />
        <span className="font-medium uppercase tracking-wider">Demo data</span>
        <span className="text-warn/70">
          Fictional sample activity for previewing the interface. No real transactions,
          wallets or people are represented. Add API keys to go live.
        </span>
      </div>
    </div>
  );
}

/** Small inline tag for individual demo items. */
export function DemoTag() {
  return (
    <Badge tone="warn" className="!text-[10px]">
      Demo
    </Badge>
  );
}
