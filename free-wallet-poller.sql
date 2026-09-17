-- Run this in Supabase SQL Editor after replacing both placeholders below.
-- It calls Signal's free Solana wallet poller every five minutes.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule(jobid)
from cron.job
where jobname = 'signal-wallet-poller';

select cron.schedule(
  'signal-wallet-poller',
  '*/5 * * * *',
  $$
  select net.http_get(
    url := 'https://YOUR-SIGNAL-DOMAIN/api/cron/solana',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer YOUR-SOLANA-CRON-SECRET'
    )
  );
  $$
);
