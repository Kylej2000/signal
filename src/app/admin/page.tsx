"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/primitives";
import { clsx } from "@/lib/clsx";

interface AdminInfluencer {
  id: string;
  name: string;
  slug: string;
  x_handle: string | null;
  followers: number | null;
  active: boolean;
  wallets: {
    id: string;
    address: string;
    chain: string;
    verification_status: string;
    active: boolean;
  }[];
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [data, setData] = useState<AdminInfluencer[]>([]);
  const [loading, setLoading] = useState(false);

  const headers = useCallback(
    () => ({ "content-type": "application/json", "x-admin-password": password }),
    [password],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/influencers", { headers: headers() });
      if (res.status === 401) {
        setError("Incorrect password.");
        setAuthed(false);
        return;
      }
      const json = await res.json();
      setDemo(Boolean(json.demo));
      setData(json.influencers ?? []);
      setAuthed(true);
    } catch {
      setError("Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  const submit = async (path: string, body: unknown) => {
    setError(null);
    setNotice(null);
    const res = await fetch(path, { method: "POST", headers: headers(), body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? "Request failed.");
      return false;
    }
    setNotice(json.message ?? "Saved.");
    await load();
    return true;
  };

  const removeSamples = async () => {
    setError(null);
    setNotice(null);
    const res = await fetch("/api/admin/influencers", { method: "DELETE", headers: headers() });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setError(json.error ?? "Cleanup failed.");
    setNotice(json.message ?? "Sample records removed.");
    await load();
  };

  const importKols = async () => {
    setError(null);
    setNotice(null);
    const res = await fetch("/api/admin/import-kols", { method: "POST", headers: headers() });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setError(json.error ?? "Import failed.");
    setNotice(json.message ?? "KOL wallets imported.");
    await load();
  };

  const importEvm = async () => {
    setError(null);
    setNotice(null);
    const res = await fetch("/api/admin/import-evm", { method: "POST", headers: headers() });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setError(json.error ?? "EVM import failed.");
    setNotice(json.message ?? "EVM wallets imported.");
    await load();
  };

  if (!authed) {
    return (
      <div className="mx-auto max-w-sm py-24">
        <h1 className="text-xl font-semibold">Admin access</h1>
        <p className="mt-2 text-sm text-muted">Enter the admin password to continue.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="mt-5 flex flex-col gap-3"
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm outline-none focus:border-signal/50"
          />
          <button
            type="submit"
            className="rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-signal-bright"
          >
            {loading ? "Checking…" : "Enter"}
          </button>
          {error && <p className="text-sm text-sell">{error}</p>}
        </form>
        <p className="mt-4 text-[11px] text-faint">
          Set <code className="text-muted">ADMIN_PASSWORD</code> in your environment. This is
          MVP-grade protection — put the panel behind additional auth before production.
        </p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-signal/80">
            Admin
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Manage tracking</h1>
        </div>
        <button onClick={load} className="text-xs text-muted hover:text-signal">
          Refresh
        </button>
      </div>

      {demo && (
        <div className="mt-4 rounded-lg border border-warn/25 bg-warn/5 px-4 py-2.5 text-xs text-warn/90">
          Demo mode is on. You can preview the panel, but changes are not persisted. Configure
          Supabase (see SETUP.md) and set <code>NEXT_PUBLIC_DEMO_MODE=false</code> to save.
        </div>
      )}
      {notice && (
        <div className="mt-4 rounded-lg border border-signal/25 bg-signal/5 px-4 py-2.5 text-xs text-signal">
          {notice}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-lg border border-sell/25 bg-sell/5 px-4 py-2.5 text-xs text-sell">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <AddInfluencerForm onSubmit={(body) => submit("/api/admin/influencers", body)} />
        <AddWalletForm
          influencers={data}
          onSubmit={(body) => submit("/api/admin/wallets", body)}
        />
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Tracked influencers & wallets</h2>
          <div className="flex items-center gap-4">
            <button onClick={importEvm} className="text-xs font-semibold text-signal hover:underline">
              Import sourced EVM wallets
            </button>
            <button onClick={importKols} className="text-xs font-semibold text-signal hover:underline">
              Import top 50 KOL wallets
            </button>
            <button onClick={removeSamples} className="text-xs text-sell hover:underline">
              Remove sample data
            </button>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {data.map((inf) => (
            <div key={inf.id} className="rounded-xl border border-ink-700 bg-ink-850 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{inf.name}</span>{" "}
                  {inf.x_handle && <span className="text-xs text-faint">@{inf.x_handle}</span>}
                </div>
                <Badge tone={inf.active ? "signal" : "muted"}>
                  {inf.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="mt-3 space-y-1.5">
                {inf.wallets.length === 0 && (
                  <div className="text-xs text-faint">No wallets.</div>
                )}
                {inf.wallets.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between rounded-md border border-ink-700 bg-ink-800 px-3 py-1.5"
                  >
                    <span className="tabular text-xs text-muted">{w.address}</span>
                    <div className="flex items-center gap-2">
                      <VerifBadge status={w.verification_status} />
                      <Badge tone="muted">{chainLabel(w.chain)}</Badge>
                      <span
                        className={clsx(
                          "h-1.5 w-1.5 rounded-full",
                          w.active ? "bg-buy" : "bg-faint",
                        )}
                        title={w.active ? "Monitoring" : "Paused"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddInfluencerForm({ onSubmit }: { onSubmit: (b: unknown) => Promise<boolean> }) {
  const [f, setF] = useState({ name: "", x_handle: "", followers: "", profile_image: "", description: "" });
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
