-- Run once in Supabase SQL Editor before enabling the multichain cron route.
alter type chain add value if not exists 'ethereum';
alter type chain add value if not exists 'bnb';
alter type chain add value if not exists 'avalanche';
alter type chain add value if not exists 'base';
alter type chain add value if not exists 'arbitrum';
alter type chain add value if not exists 'optimism';
alter type chain add value if not exists 'polygon';
alter type chain add value if not exists 'robinhood_chain';

alter table transactions add column if not exists quote_amount numeric;
alter table transactions add column if not exists quote_symbol text;
update transactions set quote_amount = sol_amount, quote_symbol = 'SOL'
where quote_amount is null and sol_amount is not null;

drop view if exists feed_signals;

create or replace view feed_signals as
select
  s.id, s.signal_type, s.created_at, s.seconds_between,
  i.id as influencer_id, i.name as influencer_name, i.slug as influencer_slug,
  i.x_handle, i.profile_image,
  t.id as token_id, t.symbol as token_symbol, t.name as token_name,
  t.contract_address, t.image_url as token_image, t.dexscreener_url, t.chain,
  tx.id as transaction_id, tx.transaction_hash, tx.transaction_type,
  tx.usd_value, tx.token_amount, tx.sol_amount, tx.quote_amount, tx.quote_symbol,
  tx.market_cap, tx.liquidity, tx.token_price, tx.dex,
  tx.block_timestamp, tx.detected_at, tx.price_source,
  w.address as wallet_address, w.verification_status as wallet_verification_status,
  ct.block_timestamp as correlated_purchase_time,
  ct.market_cap as correlated_market_cap,
  sp.id as social_post_id, sp.post_url, sp.content as post_content, sp.posted_at
from signals s
join influencers i on i.id = s.influencer_id
left join tokens t on t.id = s.token_id
left join transactions tx on tx.id = s.transaction_id
left join wallets w on w.id = tx.wallet_id
left join transactions ct on ct.id = s.correlated_transaction_id
left join social_posts sp on sp.id = s.social_post_id
order by s.created_at desc;
