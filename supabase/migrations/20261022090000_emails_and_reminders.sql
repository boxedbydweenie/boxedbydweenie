alter table public.orders add column if not exists emailed_at timestamptz;
alter table public.gift_cards add column if not exists sent_at timestamptz;
create table if not exists public.reminder_log (
  user_id uuid not null, key text not null, sent_on date not null default current_date,
  primary key (user_id, key)
);
alter table public.reminder_log enable row level security;
create extension if not exists pg_cron;
create extension if not exists pg_net;
-- Daily at 07:00 Lagos: gift cards due today + gift calendar reminders
select cron.schedule('bbd-daily-emails', '0 6 * * *', $$select net.http_post(url := 'https://zstplraslhhkfyiapjdm.supabase.co/functions/v1/reminders', headers := '{"Content-Type":"application/json"}'::jsonb, body := '{}'::jsonb)$$);
