-- Paced sending for cold lists: a daily limit that can grow each day, released gradually through the working day (Lagos time),
-- plus an automatic pause when too many emails bounce or anyone complains.

alter table public.email_campaigns
  add column if not exists daily_limit integer check (daily_limit is null or daily_limit between 1 and 100000),
  add column if not exists daily_step integer not null default 0 check (daily_step between 0 and 100000),
  add column if not exists bounce_pause_pct numeric default 5 check (bounce_pause_pct is null or (bounce_pause_pct > 0 and bounce_pause_pct <= 100)),
  add column if not exists pause_reason text,
  add column if not exists brake_since timestamptz;

-- Claims queued emails for the worker. A campaign with a daily limit only sends 08:00 to 17:00 Lagos time, and its allowance for the day
-- (limit + step per day since it started) is released evenly from 08:00 to 14:00 so mail goes out as a steady trickle, not one burst.
-- A campaign started after 17:00 counts its first day from the next morning (the +7 hours below), so day 1 is never wasted.
create or replace function public.claim_email_sends(p_limit integer)
returns setof public.email_sends
language plpgsql security definer set search_path to ''
as $$
declare lt timestamp := now() at time zone 'Africa/Lagos'; mins numeric; frac numeric; day_start timestamptz; today date;
begin
  perform pg_advisory_xact_lock(727001); -- one claim at a time, so overlapping workers can never overshoot a daily limit
  mins := extract(hour from lt) * 60 + extract(minute from lt);
  frac := least(1, greatest(0, mins - 480) / 360.0);
  today := lt::date;
  day_start := date_trunc('day', lt) at time zone 'Africa/Lagos';
  return query
  with camp as (
    select c.id,
      case
        when c.daily_limit is null then null
        when mins < 480 or mins >= 1020 then 0
        else greatest(0, ceil((c.daily_limit + c.daily_step * greatest(0, today - ((coalesce(c.queued_at, now()) at time zone 'Africa/Lagos') + interval '7 hours')::date)) * frac)::int
          - (select count(*) from public.email_sends x where x.campaign_id = c.id and not x.is_test and (x.status = 'sending' or x.sent_at >= day_start))::int)
      end as room
    from public.email_campaigns c where c.status = 'sending'
  ),
  ranked as (
    select e.id, e.queued_at, camp.room, row_number() over (partition by e.campaign_id order by e.queued_at, e.id) as rn
    from public.email_sends e join camp on camp.id = e.campaign_id
    where e.status = 'queued' and not e.is_test and (e.not_before is null or e.not_before <= now())
  ),
  picked as (select id from ranked where room is null or rn <= room order by queued_at, id limit p_limit),
  locked as (select e.id from public.email_sends e where e.id in (select id from picked) and e.status = 'queued' for update of e skip locked),
  upd as (
    update public.email_sends s set status = 'sending', attempts = s.attempts + 1, claimed_at = now()
    where s.id in (select id from locked) returning s.*
  )
  select * from upd;
end $$;

-- Pauses a sending campaign when, among the emails sent since it started (or was last resumed), at least 30 have gone out and the bounce
-- rate is above its limit, or when two or more people have marked it as spam. Called by the worker every minute.
create or replace function public.auto_pause_campaigns()
returns integer
language plpgsql security definer set search_path to ''
as $$
declare r record; n int := 0;
begin
  for r in
    select c.id, c.bounce_pause_pct as lim, count(s.sent_at) as sent, count(s.bounced_at) as bounced, count(s.complained_at) as complained
    from public.email_campaigns c
    join public.email_sends s on s.campaign_id = c.id and not s.is_test and s.sent_at >= coalesce(c.brake_since, c.queued_at)
    where c.status = 'sending' and c.bounce_pause_pct is not null
    group by c.id, c.bounce_pause_pct
  loop
    if r.complained >= 2 then
      update public.email_campaigns set status = 'paused', updated_at = now(),
        pause_reason = format('Paused automatically: %s people marked this email as spam. Check your list and message before resuming.', r.complained)
        where id = r.id and status = 'sending';
      n := n + 1;
    elsif r.sent >= 30 and r.bounced * 100.0 / r.sent > r.lim then
      update public.email_campaigns set status = 'paused', updated_at = now(),
        pause_reason = format('Paused automatically: %s of %s sent emails bounced (%s%%), above your %s%% limit. Clean the list before resuming, or too many bounces can get the sending domain blocked.',
          r.bounced, r.sent, round(r.bounced * 100.0 / r.sent, 1), r.lim)
        where id = r.id and status = 'sending';
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;

revoke all on function public.claim_email_sends(integer) from public, anon, authenticated;
revoke all on function public.auto_pause_campaigns() from public, anon, authenticated;
grant execute on function public.claim_email_sends(integer) to service_role;
grant execute on function public.auto_pause_campaigns() to service_role;
