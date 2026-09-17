-- ============================================================================
-- SIGNAL — Postgres / Supabase schema
-- Solana MVP: influencer wallet + social activity tracker.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) once you are
-- ready to move off DEMO_MODE. Idempotent-friendly: uses IF NOT EXISTS where
-- practical so you can re-run during development.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type chain as enum ('solana');
exception when duplicate_object then null; end $$;

do $$ begin
  create type verification_status as enum (
    'verified',            -- attribution confirmed by Signal
    'publicly_disclosed',  -- influencer publicly disclosed the address
    'community_reported',  -- reported by community, not confirmed
    'unverified'           -- no attribution evidence
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type transaction_type as enum ('buy', 'sell', 'transfer_in', 'transfer_out', 'unknown');
exception when duplicate_object then null; end $$;

do $$ begin
  create type social_platform as enum ('x');
exception when duplicate_object then null; end $$;

do $$ begin
  create type mention_confidence as enum ('high', 'medium', 'low');
exception when duplicate_object then null; end $$;

do $$ begin
  create type signal_type as enum ('wallet_buy', 'wallet_sell', 'social_mention', 'correlated');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- influencers
-- ----------------------------------------------------------------------------
create table if not exists influencers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  x_handle      text,                       -- stored without leading '@'
  profile_image text,
  followers     bigint,
  category      text,
  description   text,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_influencers_active on influencers (active);
create unique index if not exists uq_influencers_x_handle
  on influencers (lower(x_handle)) where x_handle is not null;

-- ----------------------------------------------------------------------------
-- wallets  (a public, on-chain address attributed to an influencer)
-- ----------------------------------------------------------------------------
create table if not exists wallets (
  id                  uuid primary key default gen_random_uuid(),
  influencer_id       uuid not null references influencers (id) on delete cascade,
  address             text not null,
  chain               chain not null default 'solana',
  label               text,
  verification_status verification_status not null default 'unverified',
  verification_source text,                 -- URL to public disclosure / evidence
  verified_at         timestamptz,
  active              boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  -- The same address can only be tracked once per chain.
  constraint uq_wallet_address_chain unique (address, chain)
);
create index if not exists idx_wallets_influencer on wallets (influencer_id);
create index if not exists idx_wallets_active on wallets (active) where active = true;
create index if not exists idx_wallets_address on wallets (address);

-- ----------------------------------------------------------------------------
-- tokens
-- ----------------------------------------------------------------------------
create table if not exists tokens (
  id               uuid primary key default gen_random_uuid(),
  chain            chain not null default 'solana',
  contract_address text not null,           -- SPL mint address
  symbol           text,
  name             text,
  image_url        text,
  decimals         smallint,
  dexscreener_url  text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint uq_token_mint_chain unique (contract_address, chain)
);
create index if not exists idx_tokens_symbol on tokens (lower(symbol));

-- ----------------------------------------------------------------------------
-- transactions
--   One row per on-chain swap we care about. Idempotency is enforced by the
--   unique (transaction_hash, wallet_id, token_id) constraint: a webhook can
--   fire the same signature more than once and we will not duplicate.
-- ----------------------------------------------------------------------------
create table if not exists transactions (
  id                uuid primary key default gen_random_uuid(),
  wallet_id         uuid not null references wallets (id) on delete cascade,
  token_id          uuid not null references tokens (id) on delete restrict,
  transaction_hash  text not null,          -- Solana signature
  transaction_type  transaction_type not null default 'buy',
  token_amount      numeric,                -- tokens received (buy) / sent (sell)
  sol_amount        numeric,                -- SOL spent / received
  usd_value         numeric,
  token_price       numeric,                -- snapshot at block time
  market_cap        numeric,                -- snapshot at block time
  liquidity         numeric,                -- snapshot at block time
  price_source      text,                   -- 'birdeye_historical' | 'dexscreener_current' | 'estimate'
  dex               text,
  block_timestamp   timestamptz not null,
  detected_at       timestamptz not null default now(),
  raw               jsonb,                  -- original parsed payload for audit
  constraint uq_tx_signature_wallet_token unique (transaction_hash, wallet_id, token_id)
);
create index if not exists idx_tx_wallet on transactions (wallet_id);
create index if not exists idx_tx_token on transactions (token_id);
create index if not exists idx_tx_block_time on transactions (block_timestamp desc);
create index if not exists idx_tx_type on transactions (transaction_type);

-- ----------------------------------------------------------------------------
-- social_posts
-- ----------------------------------------------------------------------------
create table if not exists social_posts (
  id            uuid primary key default gen_random_uuid(),
  influencer_id uuid not null references influencers (id) on delete cascade,
  platform      social_platform not null default 'x',
  post_id       text not null,              -- platform-native id
  post_url      text,
  content       text,
  posted_at     timestamptz not null,
  detected_at   timestamptz not null default now(),
  raw           jsonb,
  constraint uq_post_platform_id unique (platform, post_id)
);
create index if not exists idx_posts_influencer on social_posts (influencer_id);
create index if not exists idx_posts_posted_at on social_posts (posted_at desc);

-- ----------------------------------------------------------------------------
-- social_token_mentions
-- ----------------------------------------------------------------------------
create table if not exists social_token_mentions (
  id               uuid primary key default gen_random_uuid(),
  social_post_id   uuid not null references social_posts (id) on delete cascade,
  token_id         uuid references tokens (id) on delete set null,
  ticker           text,
  contract_address text,
  confidence       mention_confidence not null default 'low',
  match_reason     text,
  created_at       timestamptz not null default now(),
  constraint uq_mention_post_token unique (social_post_id, token_id, ticker)
);
create index if not exists idx_mentions_post on social_token_mentions (social_post_id);
create index if not exists idx_mentions_token on social_token_mentions (token_id);

-- ----------------------------------------------------------------------------
-- signals  (the alertable event surfaced in the UI / feed)
-- ----------------------------------------------------------------------------
create table if not exists signals (
  id             uuid primary key default gen_random_uuid(),
  influencer_id  uuid not null references influencers (id) on delete cascade,
  token_id       uuid references tokens (id) on delete set null,
  transaction_id uuid references transactions (id) on delete cascade,
  social_post_id uuid references social_posts (id) on delete cascade,
  signal_type    signal_type not null,
  -- correlation metadata (populated for social/correlated signals)
  correlated_transaction_id uuid references transactions (id) on delete set null,
  seconds_between            integer,       -- wallet buy -> social post gap
  created_at     timestamptz not null default now(),
  -- Prevent duplicate signals for the same underlying event.
  constraint uq_signal_transaction unique (transaction_id),
  constraint uq_signal_social_post unique (social_post_id)
);
create index if not exists idx_signals_created on signals (created_at desc);
create index if not exists idx_signals_influencer on signals (influencer_id);
create index if not exists idx_signals_type on signals (signal_type);
create index if not exists idx_signals_token on signals (token_id);

-- ----------------------------------------------------------------------------
-- alert_deliveries  (audit of alerts pushed out per channel)
-- ----------------------------------------------------------------------------
create table if not exists alert_deliveries (
  id          uuid primary key default gen_random_uuid(),
  signal_id   uuid not null references signals (id) on delete cascade,
  channel     text not null,                -- 'inapp' | 'telegram' | 'discord' | 'email' | 'push'
  status      text not null default 'sent', -- 'sent' | 'failed' | 'skipped'
  detail      text,
  created_at  timestamptz not null default now(),
  constraint uq_delivery_signal_channel unique (signal_id, channel)
);
create index if not exists idx_deliveries_signal on alert_deliveries (signal_id);

-- ----------------------------------------------------------------------------
-- updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  foreach t in array array['influencers','wallets','tokens'] loop
    execute format(
      'drop trigger if exists trg_%1$s_updated_at on %1$s;
       create trigger trg_%1$s_updated_at before update on %1$s
       for each row execute function set_updated_at();', t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Row Level Security
--   Reads: public (anon) can read the surfaced content.
--   Writes: only the service role (used by server API routes) may write.
--   The service role bypasses RLS, so we simply enable RLS + a read policy.
-- ----------------------------------------------------------------------------
alter table influencers            enable row level security;
alter table wallets                enable row level security;
alter table tokens                 enable row level security;
alter table transactions           enable row level security;
alter table social_posts           enable row level security;
alter table social_token_mentions  enable row level security;
alter table signals                enable row level security;
alter table alert_deliveries       enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'influencers','wallets','tokens','transactions',
    'social_posts','social_token_mentions','signals'
  ] loop
    execute format('drop policy if exists "public_read_%1$s" on %1$s;', t);
    execute format(
      'create policy "public_read_%1$s" on %1$s for select using (true);', t);
  end loop;
end $$;

-- Do NOT expose wallet addresses of unverified attributions to the public API
-- by default at the app layer (handled in code). alert_deliveries stays private
-- (no public policy => no anon access).

-- ----------------------------------------------------------------------------
-- Realtime: add signals + transactions + social_posts to the publication so the
-- dashboard can subscribe to inserts.
-- ----------------------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table signals;
  exception when others then null; end;
  begin
    alter publication supabase_realtime add table transactions;
  exception when others then null; end;
  begin
    alter publication supabase_realtime add table social_posts;
  exception when others then null; end;
end $$;

-- ----------------------------------------------------------------------------
-- Convenience view: feed items with resolved names (used by API layer)
-- ----------------------------------------------------------------------------
create or replace view feed_signals as
select
  s.id,
  s.signal_type,
  s.created_at,
  s.seconds_between,
  i.id   as influencer_id,
  i.name as influencer_name,
  i.slug as influencer_slug,
  i.x_handle,
  i.profile_image,
  t.id   as token_id,
  t.symbol as token_symbol,
  t.name   as token_name,
  t.contract_address,
  t.image_url as token_image,
  t.dexscreener_url,
  tx.id as transaction_id,
  tx.transaction_hash,
  tx.transaction_type,
  tx.usd_value,
  tx.token_amount,
  tx.sol_amount,
  tx.market_cap,
  tx.liquidity,
  tx.token_price,
  tx.dex,
  tx.block_timestamp,
  tx.detected_at,
  tx.price_source,
  w.address as wallet_address,
  w.verification_status as wallet_verification_status,
  ct.block_timestamp as correlated_purchase_time,
  ct.market_cap as correlated_market_cap,
  sp.id as social_post_id,
  sp.post_url,
  sp.content as post_content,
  sp.posted_at
from signals s
join influencers i on i.id = s.influencer_id
left join tokens t on t.id = s.token_id
left join transactions tx on tx.id = s.transaction_id
left join wallets w on w.id = tx.wallet_id
left join transactions ct on ct.id = s.correlated_transaction_id
left join social_posts sp on sp.id = s.social_post_id
order by s.created_at desc;
