-- Enable pg_cron extension (requires Supabase Pro or enabling in dashboard)
-- Dashboard: Database > Extensions > pg_cron
-- This migration sets up the nightly scoring cron job.

create extension if not exists pg_cron;

-- Schedule score-predictions edge function at 2AM Chicago time (8AM UTC)
-- The edge function URL pattern: https://<project>.supabase.co/functions/v1/score-predictions
-- We call it via pg_net (HTTP from within Postgres)

create extension if not exists pg_net;

select cron.schedule(
  'score-predictions-nightly',
  '0 8 * * *',  -- 2AM Chicago (CST = UTC-6, CDT = UTC-5; use 8AM UTC to cover both)
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/score-predictions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Also schedule heat score cleanup every 15 minutes
select cron.schedule(
  'refresh-heat-scores',
  '*/15 * * * *',
  $$select refresh_venue_heat_scores();$$
);

-- Schedule spike notification check every 30 minutes during evening hours (8PM-3AM UTC+5 = 1AM-8AM UTC)
select cron.schedule(
  'notify-neighborhood-spikes',
  '*/30 1-8 * * *',
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/notify-spikes',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
