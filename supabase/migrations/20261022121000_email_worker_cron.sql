-- Sending worker: every minute. Idempotent; it only sends emails a staff member already queued.
select cron.schedule('bbd-campaign-worker', '* * * * *', $$select net.http_post(url := 'https://zstplraslhhkfyiapjdm.supabase.co/functions/v1/campaign-worker', headers := '{"Content-Type":"application/json"}'::jsonb, body := '{}'::jsonb)$$);
