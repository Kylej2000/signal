-- ============================================================================
-- SIGNAL — seed data for a LIVE Supabase database (optional).
--
-- This mirrors the in-app DEMO data so you can test the real data path
-- (Supabase reads, realtime) without waiting for live on-chain activity.
-- All rows below are FICTIONAL sample data for testing only.
--
-- Run after schema.sql. Safe to re-run (uses on-conflict upserts).
-- ============================================================================

-- Influencers ----------------------------------------------------------------
insert into influencers (id, name, slug, x_handle, profile_image, followers, category, description, active) values
  ('11111111-1111-1111-1111-111111111111', 'Crypto God John', 'crypto-god-john', 'CryptoGodJohn', null, 462000, 'Solana Trader', 'High-conviction Solana memecoin trader. Sample profile for testing.', true),
  ('22222222-2222-2222-2222-222222222222', 'Solana Sasha', 'solana-sasha', 'SolanaSasha', null, 188000, 'On-chain Analyst', 'On-chain analytics and early token discovery. Sample profile.', true),
  ('33333333-3333-3333-3333-333333333333', 'DeFi Dan', 'defi-dan', 'DeFiDan', null, 96500, 'DeFi / Yield', 'DeFi strategist. Sample profile for testing.', true)
on conflict (id) do update set
  name = excluded.name, x_handle = excluded.x_handle, followers = excluded.followers;

-- Wallets --------------------------------------------------------------------
insert into wallets (id, influencer_id, address, chain, label, verification_status, verification_source, verified_at, active) values
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Aacn8Xy1Q9m2r4t6u8w0z2b4d6f8h0j2k4m6p8r8YSC', 'solana', 'Main', 'publicly_disclosed', 'https://x.com/CryptoGodJohn/status/0000000000000000000', now() - interval '90 days', true),
  ('a1111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'BdxLp5Kq3n1v7c9x2z4b6d8f0h2j4l6n8p0r2t4v6WQE', 'solana', 'Degen', 'verified', 'https://solscan.io/account/BdxLp5Kq3n1v7c9x2z4b6d8f0h2j4l6n8p0r2t4v6WQE', now() - interval '60 days', true),
  ('a2222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222', 'Ck9Rm2Ht4p6s8u0w2y4a6c8e0g2i4k6m8o0q2s4u6TZP', 'solana', 'Main', 'publicly_disclosed', 'https://x.com/SolanaSasha/status/0000000000000000000', now() - interval '45 days', true),
  ('a3333333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333333', 'Dm4Wn6Ju8q0t2v4x6z8b0d2f4h6j8l0n2p4r6t8v0YRK', 'solana', 'Main', 'community_reported', 'https://x.com/some_user/status/0000000000000000000', null, true)
on conflict (address, chain) do nothing;

-- Tokens ---------------------------------------------------------------------
insert into tokens (id, chain, contract_address, symbol, name, image_url, decimals, dexscreener_url) values
  ('b1111111-1111-1111-1111-111111111111', 'solana', 'JUBJUBmintAddrExample1111111111111111111111', 'JUBJUB', 'JubJub', null, 6, 'https://dexscreener.com/solana/JUBJUBmintAddrExample1111111111111111111111'),
  ('b2222222-2222-2222-2222-222222222222', 'solana', 'WIFdogmintAddrExample22222222222222222222222', 'WIF', 'dogwifhat', null, 6, 'https://dexscreener.com/solana/WIFdogmintAddrExample22222222222222222222222'),
  ('b3333333-3333-3333-3333-333333333333', 'solana', 'PNUTmintAddrExample3333333333333333333333333', 'PNUT', 'Peanut', null, 6, 'https://dexscreener.com/solana/PNUTmintAddrExample3333333333333333333333333')
on conflict (contract_address, chain) do nothing;

-- Transactions (buys) --------------------------------------------------------
insert into transactions (id, wallet_id, token_id, transaction_hash, transaction_type, token_amount, sol_amount, usd_value, token_price, market_cap, liquidity, price_source, dex, block_timestamp, detected_at) values
  ('c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', '5xTxSignatureJUBJUBexample1111111111111111111111111111111111111111111111', 'buy', 6489792, 4.83, 966, 0.000149, 130000, 82000, 'birdeye_historical', 'Jupiter', now() - interval '2 minutes', now() - interval '2 minutes' + interval '5 seconds'),
  ('c2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111112', 'b2222222-2222-2222-2222-222222222222', '5xTxSignatureWIFexample2222222222222222222222222222222222222222222222222', 'buy', 1240, 12.4, 2480, 2.0, 2400000000, 5400000, 'birdeye_historical', 'Raydium', now() - interval '3 hours', now() - interval '3 hours' + interval '6 seconds'),
  ('c3333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222221', 'b3333333-3333-3333-3333-333333333333', '5xTxSignaturePNUTexample33333333333333333333333333333333333333333333333', 'buy', 95000, 8.1, 1620, 0.017, 1700000, 210000, 'birdeye_historical', 'Jupiter', now() - interval '20 minutes', now() - interval '20 minutes' + interval '4 seconds')
on conflict (transaction_hash, wallet_id, token_id) do nothing;

-- Social posts ---------------------------------------------------------------
insert into social_posts (id, influencer_id, platform, post_id, post_url, content, posted_at, detected_at) values
  ('d1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'x', '1900000000000000001', 'https://x.com/CryptoGodJohn/status/1900000000000000001', 'Interesting project I''ve been watching... $JUBJUB', now() - interval '2 minutes' + interval '12 minutes', now() - interval '2 minutes' + interval '12 minutes' + interval '30 seconds'),
  ('d2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'x', '1900000000000000002', 'https://x.com/SolanaSasha/status/1900000000000000002', 'This one is early. $PNUT chart looks primed.', now() - interval '20 minutes' + interval '9 minutes', now() - interval '20 minutes' + interval '9 minutes' + interval '20 seconds')
on conflict (platform, post_id) do nothing;

-- Mentions -------------------------------------------------------------------
insert into social_token_mentions (id, social_post_id, token_id, ticker, contract_address, confidence, match_reason) values
  ('e1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'JUBJUB', null, 'high', 'Unique cashtag matched a token the influencer''s wallet bought 12m earlier'),
  ('e2222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222', 'b3333333-3333-3333-3333-333333333333', 'PNUT', null, 'high', 'Unique cashtag matched a token the influencer''s wallet bought 9m earlier')
on conflict (social_post_id, token_id, ticker) do nothing;

-- Signals --------------------------------------------------------------------
insert into signals (id, influencer_id, token_id, transaction_id, social_post_id, signal_type, correlated_transaction_id, seconds_between, created_at) values
  ('f1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', null, 'wallet_buy', null, null, now() - interval '2 minutes' + interval '5 seconds'),
  ('f2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', null, 'wallet_buy', null, null, now() - interval '3 hours' + interval '6 seconds'),
  ('f3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'b3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', null, 'wallet_buy', null, null, now() - interval '20 minutes' + interval '4 seconds'),
  ('f4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', null, 'd1111111-1111-1111-1111-111111111111', 'correlated', 'c1111111-1111-1111-1111-111111111111', 759, now() - interval '2 minutes' + interval '12 minutes' + interval '30 seconds'),
  ('f5555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'b3333333-3333-3333-3333-333333333333', null, 'd2222222-2222-2222-2222-222222222222', 'correlated', 'c3333333-3333-3333-3333-333333333333', 540, now() - interval '20 minutes' + interval '9 minutes' + interval '20 seconds')
on conflict (transaction_id) do nothing;
