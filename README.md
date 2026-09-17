# Signal

**Real-time crypto influencer wallet & social activity tracker — Solana MVP.**

Signal is an intelligence / alerting dashboard that surfaces *publicly observable*
blockchain and social-media activity as fast and clearly as possible:

1. **Wallet buys** — when a publicly identified Solana wallet swaps SOL / USDC / USDT
   for an SPL token.
2. **Social mentions** — when a tracked influencer mentions a token on X.
3. **Wallet → social correlation** — the headline feature: when a wallet buys a token
   and the same influencer posts about it minutes later, Signal shows the exact gap.

Signal **does not** execute trades, copy-trade or touch anyone's wallet. It reads only
public data and never asks for seed phrases or private keys.

> ⚠️ It ships in **DEMO MODE** with realistic **fictional** sample data so you can
> explore the entire UX before adding any API keys. Nothing in demo mode represents a
> real person, wallet, token or transaction.

---

## Quick start (demo mode — zero config)

```bash
npm install
npm run dev
# open http://localhost:3000
```

That's it. The app runs on demo data. A "Demo data" banner is shown site-wide and every
sample item carries a Demo tag.

## Tech stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** (dark Bloomberg-terminal aesthetic)
- **Supabase / Postgres** (data + realtime)
- **Solana public RPC** (free five-minute wallet polling) or optional **Helius** webhooks
- **DexScreener / Birdeye** (token enrichment + price snapshots)
- **X API v2** (social monitoring)
- Alert channels: **in-app** (live), plus ready-to-enable **Telegram / Discord / Email**
- Deploys to **Vercel**

## Going live

See **[SETUP.md](./SETUP.md)** for the full walkthrough. In short:

1. Create a Supabase project, run `supabase/schema.sql` (and optionally `supabase/seed.sql`).
2. Copy `.env.example` → `.env.local`, fill in Supabase keys, set `NEXT_PUBLIC_DEMO_MODE=false`.
3. Add influencers + wallets in `/admin`.
4. For the free MVP, schedule `/api/cron/solana` with `supabase/free-wallet-poller.sql`.
   Helius webhooks remain available as an optional faster upgrade.
5. (Optional) Add an X bearer token + a cron to poll `/api/cron/twitter`.
6. (Optional) Add Telegram / Discord / email credentials for push alerts.

## Project structure

```
supabase/
  schema.sql        Postgres schema: tables, indexes, constraints, RLS, realtime, feed view
  seed.sql          Optional fictional seed data for a live DB
src/app/
  page.tsx                     Landing (hero + live alert preview)
  feed/                        Live signal feed (the main product)
  influencers/                 Influencer directory
  influencer/[slug]/           Influencer profile (+ wallet→social correlation)
  signal/[id]/                 Alert detail page
  how-it-works/                Explainer
  admin/                       Protected admin panel (add influencers/wallets)
  api/
    webhooks/helius/           Helius webhook ingestion (auth + idempotent)
    signals/                   Feed read API (+ realtime hydrate)
    admin/influencers/         Admin CRUD
    admin/wallets/             Admin CRUD (+ Helius watchlist sync)
    cron/twitter/              X polling endpoint (secured)
src/lib/
  config.ts         Env + capability detection (demo-safe)
  data/             Data access layer (demo <-> Supabase)
  demo-data.ts      Fictional sample dataset
  solana/           helius.ts (auth/sync), parser.ts (swap detection)
  enrichment/       dexscreener.ts, birdeye.ts, index.ts (price snapshots)
  social/           twitter.ts (X client), matcher.ts (mention extraction + confidence)
  alerts/           Channel abstraction: inapp / telegram / discord / email
  signals/create.ts Orchestration: parse → enrich → store → signal → alert
```

## Design principles

- **Idempotent ingestion.** Transactions are unique on
  `(transaction_hash, wallet_id, token_id)`, signals on `transaction_id` /
  `social_post_id`, and alert deliveries on `(signal_id, channel)`. The same webhook can
  fire twice without duplicating anything.
- **Buys, not transfers.** The parser computes net wallet balance changes and requires a
  quote-asset spend *and* a token receipt. Plain transfers never become buys.
- **Honest data.** Price/market-cap/liquidity are snapshotted at transaction time when a
  historical source is available, and clearly labelled as estimates otherwise.
- **Attribution is data quality.** Wallets carry `verified / publicly_disclosed /
  community_reported / unverified` status. Only the first two generate production alerts
  by default.

## Disclaimer

Signal displays publicly available blockchain and social-media activity for informational
purposes. Wallet attribution may be incomplete or inaccurate. Nothing displayed
constitutes financial advice.
