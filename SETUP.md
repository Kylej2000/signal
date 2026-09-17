# Signal — setup guide

This walks you from the zero-config demo to a fully live deployment. Each stage is
independent — the app keeps working as you enable pieces one at a time.

---

## 0. Run the demo (no keys)

```bash
npm install
npm run dev            # http://localhost:3000
```

Everything works on fictional demo data. `NEXT_PUBLIC_DEMO_MODE` defaults to `true`.

---

## 1. Supabase (database + realtime)

1. Create a project at https://supabase.com.
2. In **SQL Editor**, paste and run `supabase/schema.sql`. This creates all tables,
   indexes, unique constraints, RLS policies, the realtime publication, and the
   `feed_signals` view.
3. (Optional) Run `supabase/seed.sql` to load fictional sample rows so you can see the
   live data path immediately.
4. In **Project Settings → API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**server-only, never expose**)
5. Copy `.env.example` → `.env.local`, paste those three values, and set:
   ```
   NEXT_PUBLIC_DEMO_MODE=false
   ```
6. Restart `npm run dev`. The app now reads from Supabase. (If Supabase env vars are
   missing, it automatically falls back to demo mode so it never renders empty.)

> **Realtime**: `schema.sql` adds `signals`, `transactions`, and `social_posts` to the
> `supabase_realtime` publication. The dashboard subscribes to `signals` inserts and
> animates new items in with no refresh.

---

## 2. Add influencers & wallets

Go to `/admin` and enter your `ADMIN_PASSWORD` (set it in `.env.local`).

- **Add influencer**: display name, X handle, followers, image, description.
- **Add wallet**: pick the influencer, paste the **public** Solana address, choose a
  verification status and paste a verification source URL.

**Attribution matters.** Only `Verified` and `Publicly Disclosed` wallets generate
production alerts by default. Never mark a wallet verified without public evidence.

When Helius is configured (next step), adding/activating a wallet automatically syncs the
monitored-address list to your Helius webhook.

---

## 3. Free Solana wallet monitoring (recommended for validation)

Signal can poll Solana's public RPC without a paid data provider. Set a long random
`SOLANA_CRON_SECRET` in Vercel, redeploy, then open
`supabase/free-wallet-poller.sql`. Replace the domain and secret placeholders and run it
in Supabase SQL Editor. Supabase will call `/api/cron/solana` every five minutes.

The route checks active wallets, parses wallet-owned SOL and SPL-token balance changes,
rejects plain transfers, and sends detected swaps through the same enrichment and alert
pipeline as Helius. Public RPC is suitable for MVP validation but may be rate-limited or
slower under load.

## 4. Optional upgrade: Helius webhooks

1. Create an API key at https://dev.helius.xyz and set `HELIUS_API_KEY`.
2. Invent a strong secret and set `HELIUS_WEBHOOK_SECRET` (used to authenticate incoming
   webhooks).
3. Create an **enhanced** webhook pointing at your deployed URL:
   `https://YOUR_DOMAIN/api/webhooks/helius`
   - **Webhook type**: Enhanced
   - **Transaction types**: SWAP (and TRANSFER/ANY if you want broader coverage)
   - **Account addresses**: your tracked wallet addresses
   - **Auth header**: set it to the exact value of `HELIUS_WEBHOOK_SECRET`

   You can create it from the Helius dashboard, or programmatically with the helper in
   `src/lib/solana/helius.ts` (`createHeliusWebhook`).
4. Put the returned webhook ID in `HELIUS_WEBHOOK_ID` so the admin panel can keep the
   address list in sync.

**What gets through:** the parser (`src/lib/solana/parser.ts`) only creates a BUY/SELL
signal when the wallet swapped a quote asset (SOL/USDC/USDT) for an SPL token (or vice
versa). Plain transfers are ignored.

Test locally with a tunnel (e.g. `ngrok http 3000`) and point the webhook at the tunnel
URL, or POST a sample enhanced-transaction payload to `/api/webhooks/helius` with the
`Authorization` header set to your secret.

---

## 5. Token enrichment (DexScreener / Birdeye)

- **DexScreener** needs no key and is used by default for name, ticker, price, market
  cap, liquidity and the DexScreener link.
- **Birdeye** (optional) improves the **historical** price snapshot at the transaction
  time. Set `BIRDEYE_API_KEY` from https://birdeye.so. When present, the transaction's
  `price_source` is `birdeye_historical`; otherwise values are labelled as current-value
  estimates.

---

## 6. X / Twitter — social monitoring

1. Get an app-only **Bearer token** from the X developer portal and set `X_BEARER_TOKEN`.
2. Set `TWITTER_CRON_SECRET` to protect the polling endpoint.
3. Schedule `/api/cron/twitter` to run periodically:
   - **Vercel Cron**: `vercel.json` already defines a schedule. Set `CRON_SECRET` (or
     `TWITTER_CRON_SECRET`) in Vercel; the route accepts `Authorization: Bearer <secret>`.
   - Or call it from any scheduler: `GET /api/cron/twitter?secret=YOUR_SECRET`.

Each run fetches recent public posts for active tracked handles, extracts cashtags /
contract addresses / DexScreener links, scores confidence (HIGH/MEDIUM/LOW), and — for
high-confidence matches — creates a `social_mention` or, when it matches a recent wallet
buy, a `correlated` signal with the exact time gap.

> Note: X API access tiers vary. The client in `src/lib/social/twitter.ts` is a thin
> abstraction — swap it for another data source without touching ingest logic.

---

## 7. Alerts (Telegram / Discord / Email)

In-app alerts work out of the box (the live feed). To add push channels, set any of:

- **Telegram** (recommended, easiest): `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`.
  Create a bot with @BotFather, then get your chat id. Alerts include inline
  Transaction / DexScreener / View-Post buttons.
- **Discord**: `DISCORD_WEBHOOK_URL`.
- **Email**: `RESEND_API_KEY` + `ALERT_EMAIL_FROM` + `ALERT_EMAIL_TO`.

Channels light up automatically when configured. Deliveries are recorded in
`alert_deliveries`, unique per `(signal_id, channel)`, so nothing double-sends.

Adding a brand-new channel is implementing the `AlertChannel` interface in
`src/lib/alerts/types.ts` and registering it in `src/lib/alerts/index.ts`.

---

## 8. Deploy to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add every environment variable from `.env.example` in **Project → Settings →
   Environment Variables**. Keep `SUPABASE_SERVICE_ROLE_KEY`, `HELIUS_*`, `X_BEARER_TOKEN`
   and secrets **server-side** (do not prefix with `NEXT_PUBLIC_`).
3. Set `NEXT_PUBLIC_SITE_URL` to your production URL.
4. Deploy. Update your Helius webhook URL to the production `/api/webhooks/helius`.

---

## Environment variable reference

See `.env.example`. Nothing secret is ever sent to the browser — only
`NEXT_PUBLIC_*` values are exposed, and those are the Supabase URL/anon key,
the demo flag, and the site URL.

## Security notes

- The admin panel uses a shared password (`ADMIN_PASSWORD`) — fine for an MVP; put it
  behind real auth (Supabase Auth, Vercel Access, etc.) before production.
- Webhook requests are authenticated with a shared secret and compared in constant time.
- Only public blockchain data is used; the app never requests private keys or seed phrases.
