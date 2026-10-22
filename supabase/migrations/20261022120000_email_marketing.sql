-- Email marketing: contacts + consent, campaigns, per-email send log, webhook events, image bucket.
-- Browser (staff) can READ these tables through RLS; every WRITE goes through the `marketing` edge function (service role).

-- 1. Contacts -----------------------------------------------------------------------------------
create table if not exists public.marketing_contacts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text, last_name text, company text,
  tags text[] not null default '{}',
  -- Why we may email them: opted_in (ticked or joined on our forms), customer, contact (gave us their email),
  -- prospect (B2B target list), unverified (bought/scraped: left out of campaigns unless explicitly included).
  basis text not null default 'contact' check (basis in ('opted_in','customer','contact','prospect','unverified')),
  consent_source text,
  consent_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active','unsubscribed','bounced','complained')),
  status_at timestamptz,
  unsub_reason text,
  unsub_token uuid not null default gen_random_uuid(),
  import_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketing_contacts_email_lower check (email = lower(email))
);
create unique index if not exists marketing_contacts_email_key on public.marketing_contacts (email);
create unique index if not exists marketing_contacts_token_key on public.marketing_contacts (unsub_token);
create index if not exists marketing_contacts_status_idx on public.marketing_contacts (status, basis);
create index if not exists marketing_contacts_tags_idx on public.marketing_contacts using gin (tags);

create table if not exists public.marketing_imports (
  id uuid primary key,
  filename text, basis text not null, tags text[] not null default '{}',
  total_rows int not null default 0, added int not null default 0, updated int not null default 0,
  invalid int not null default 0, suppressed int not null default 0,
  created_by text, created_at timestamptz not null default now()
);

-- 2. Campaigns and the send log ------------------------------------------------------------------
create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null, subject text not null default '', preheader text not null default '',
  from_name text not null default 'Boxed by Dweenie',
  html text not null default '',
  audience jsonb not null default '{"bases":["opted_in","customer","contact","prospect"],"tags":[],"exclude_tags":[]}'::jsonb,
  status text not null default 'draft' check (status in ('draft','sending','paused','sent','cancelled')),
  tested_at timestamptz,
  total int not null default 0,
  queued_at timestamptz, finished_at timestamptz,
  created_by text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.email_sends (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_campaigns(id) on delete cascade,
  contact_id uuid references public.marketing_contacts(id) on delete set null,
  email text not null, first_name text,
  is_test boolean not null default false,
  status text not null default 'queued' check (status in ('queued','sending','sent','delivered','opened','clicked','bounced','complained','failed','suppressed','cancelled')),
  resend_id text, error text, attempts int not null default 0,
  not_before timestamptz, claimed_at timestamptz,
  queued_at timestamptz not null default now(),
  sent_at timestamptz, delivered_at timestamptz, opened_at timestamptz, clicked_at timestamptz,
  bounced_at timestamptz, complained_at timestamptz, failed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists email_sends_one_per_campaign on public.email_sends (campaign_id, email) where not is_test;
create index if not exists email_sends_queue_idx on public.email_sends (status, queued_at) where status in ('queued','sending');
create index if not exists email_sends_campaign_idx on public.email_sends (campaign_id, status);
create index if not exists email_sends_resend_idx on public.email_sends (resend_id);
create index if not exists email_sends_email_idx on public.email_sends (email);

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  svix_id text not null unique,
  send_id uuid references public.email_sends(id) on delete set null,
  type text not null, email text, payload jsonb,
  created_at timestamptz not null default now()
);

-- 3. Row-level security: staff read, nobody else ---------------------------------------------------
alter table public.marketing_contacts enable row level security;
alter table public.marketing_imports enable row level security;
alter table public.email_campaigns enable row level security;
alter table public.email_sends enable row level security;
alter table public.email_events enable row level security;
create policy "Admins read contacts" on public.marketing_contacts for select to authenticated using (public.is_admin());
create policy "Admins read imports" on public.marketing_imports for select to authenticated using (public.is_admin());
create policy "Admins read campaigns" on public.email_campaigns for select to authenticated using (public.is_admin());
create policy "Admins read sends" on public.email_sends for select to authenticated using (public.is_admin());
create policy "Admins read events" on public.email_events for select to authenticated using (public.is_admin());

-- 4. Helpers -------------------------------------------------------------------------------------
create or replace function public.marketing_basis_rank(b text) returns int language sql immutable set search_path = '' as $$
  select case b when 'opted_in' then 5 when 'customer' then 4 when 'contact' then 3 when 'prospect' then 2 else 1 end
$$;
create or replace function public.email_status_rank(s text) returns int language sql immutable set search_path = '' as $$
  select case s when 'queued' then 0 when 'sending' then 1 when 'failed' then 1 when 'cancelled' then 1 when 'suppressed' then 1
    when 'sent' then 2 when 'delivered' then 3 when 'opened' then 4 when 'clicked' then 5 else 9 end
$$;

-- Who a campaign's audience rules match: active contacts only. Unverified contacts are never matched unless asked for.
create or replace function public.audience_contacts(p_audience jsonb) returns setof public.marketing_contacts
language sql stable set search_path = '' as $$
  select m.* from public.marketing_contacts m
  where m.status = 'active'
    and m.basis = any (case when jsonb_array_length(coalesce(p_audience->'bases','[]'::jsonb)) = 0
        then array['opted_in','customer','contact','prospect']
        else array(select jsonb_array_elements_text(p_audience->'bases')) end)
    and (jsonb_array_length(coalesce(p_audience->'tags','[]'::jsonb)) = 0
        or m.tags && array(select jsonb_array_elements_text(p_audience->'tags')))
    and not (m.tags && array(select jsonb_array_elements_text(coalesce(p_audience->'exclude_tags','[]'::jsonb))))
$$;
create or replace function public.audience_count(p_audience jsonb) returns int language sql stable set search_path = '' as $$
  select count(*)::int from public.audience_contacts(p_audience)
$$;

create or replace function public.marketing_audience_summary() returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'total', count(*), 'active', count(*) filter (where status = 'active'),
    'unsubscribed', count(*) filter (where status = 'unsubscribed'),
    'bounced', count(*) filter (where status = 'bounced'),
    'complained', count(*) filter (where status = 'complained'),
    'bases', (select coalesce(jsonb_object_agg(basis, n), '{}'::jsonb) from (select basis, count(*) n from public.marketing_contacts where status = 'active' group by basis) b),
    'tags', (select coalesce(jsonb_object_agg(t, n), '{}'::jsonb) from (select t, count(*) n from public.marketing_contacts c, unnest(c.tags) t where c.status = 'active' group by t) x))
  from public.marketing_contacts
$$;

create or replace function public.email_campaign_stats() returns table (
  campaign_id uuid, total int, queued int, sent int, delivered int, opened int, clicked int, bounced int, complained int, failed int
) language sql stable set search_path = '' as $$
  select s.campaign_id, count(*)::int,
    count(*) filter (where s.status in ('queued','sending'))::int,
    count(s.sent_at)::int, count(s.delivered_at)::int, count(s.opened_at)::int, count(s.clicked_at)::int,
    count(s.bounced_at)::int, count(s.complained_at)::int, count(*) filter (where s.status = 'failed')::int
  from public.email_sends s where not s.is_test group by s.campaign_id
$$;

-- 5. Server-only functions (service role) ----------------------------------------------------------
-- Pull our own list in from newsletter sign-ups, paid orders, enquiries and Gift Calendar users. Never touches status.
create or replace function public.marketing_sync() returns int language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  with src as (
    select lower(trim(email)) as email, null::text as first_name, null::text as last_name, null::text as company,
           array['newsletter'] as tags, 'opted_in' as basis, 'newsletter:' || coalesce(source, 'footer') as consent_source, created_at as consent_at
      from public.newsletter_subscribers
    union all
    select lower(trim(customer->>'email')), nullif(split_part(trim(customer->>'name'), ' ', 1), ''),
           nullif(trim(substr(trim(customer->>'name'), length(split_part(trim(customer->>'name'), ' ', 1)) + 1)), ''), null,
           array['customer'], 'customer', 'order:' || ref, created_at
      from public.orders where status in ('paid','packed','out_for_delivery','delivered') and coalesce(customer->>'email', '') <> ''
    union all
    select lower(trim(email)), nullif(split_part(trim(name), ' ', 1), ''), null, company, array['lead', kind], 'contact', 'enquiry:' || ref, created_at
      from public.leads
    union all
    select lower(trim(u.email)), nullif(split_part(trim(coalesce(u.raw_user_meta_data->>'name', '')), ' ', 1), ''), null, null,
           array['gift-calendar'], 'contact', 'gift-calendar', d.updated_at
      from public.user_data d join auth.users u on u.id = d.user_id where d.key = 'people' and coalesce(u.email, '') <> ''
  ), clean as (
    select * from src where email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'
  ), agg as (
    select c.email, max(c.first_name) as first_name, max(c.last_name) as last_name, max(c.company) as company,
      array(select distinct t from clean c2, unnest(c2.tags) t where c2.email = c.email) as tags,
      (array_agg(c.basis order by public.marketing_basis_rank(c.basis) desc))[1] as basis,
      (array_agg(c.consent_source order by public.marketing_basis_rank(c.basis) desc, c.consent_at))[1] as consent_source,
      min(c.consent_at) as consent_at
    from clean c group by c.email
  )
  insert into public.marketing_contacts as m (email, first_name, last_name, company, tags, basis, consent_source, consent_at)
  select email, first_name, last_name, company, tags, basis, consent_source, consent_at from agg
  on conflict (email) do update set
    tags = (select array(select distinct t from unnest(m.tags || excluded.tags) t)),
    first_name = coalesce(m.first_name, excluded.first_name), last_name = coalesce(m.last_name, excluded.last_name), company = coalesce(m.company, excluded.company),
    basis = case when public.marketing_basis_rank(excluded.basis) > public.marketing_basis_rank(m.basis) then excluded.basis else m.basis end,
    consent_source = case when public.marketing_basis_rank(excluded.basis) > public.marketing_basis_rank(m.basis) then excluded.consent_source else m.consent_source end,
    consent_at = case when public.marketing_basis_rank(excluded.basis) > public.marketing_basis_rank(m.basis) then excluded.consent_at else m.consent_at end,
    updated_at = now()
  where not (m.tags @> excluded.tags) or public.marketing_basis_rank(excluded.basis) > public.marketing_basis_rank(m.basis);
  get diagnostics n = row_count;
  return n;
end $$;

-- A person joining on our own forms: fresh, explicit consent. Re-activates a past unsubscribe (they chose to come back) but never a bounce or complaint.
create or replace function public.marketing_subscribe(p_email text, p_source text, p_first_name text default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.marketing_contacts as m (email, first_name, tags, basis, consent_source, consent_at)
  values (lower(trim(p_email)), nullif(trim(coalesce(p_first_name, '')), ''), array['newsletter'], 'opted_in', 'site:' || coalesce(nullif(p_source, ''), 'footer'), now())
  on conflict (email) do update set
    basis = 'opted_in', consent_source = 'site:' || coalesce(nullif(p_source, ''), 'footer'), consent_at = now(),
    first_name = coalesce(m.first_name, excluded.first_name),
    tags = (select array(select distinct t from unnest(m.tags || array['newsletter']) t)),
    status = case when m.status = 'unsubscribed' then 'active' else m.status end,
    status_at = case when m.status = 'unsubscribed' then now() else m.status_at end,
    updated_at = now();
end $$;

-- Turn a draft campaign into queued sends for everyone its audience matches. Safe to call twice: one send per address per campaign.
create or replace function public.queue_campaign(p_campaign uuid) returns int language plpgsql security definer set search_path = '' as $$
declare c public.email_campaigns; n int;
begin
  select * into c from public.email_campaigns where id = p_campaign for update;
  if not found or c.status <> 'draft' then return -1; end if;
  insert into public.email_sends (campaign_id, contact_id, email, first_name)
    select c.id, m.id, m.email, m.first_name from public.audience_contacts(c.audience) m
    on conflict (campaign_id, email) where not is_test do nothing;
  get diagnostics n = row_count;
  update public.email_campaigns set status = case when n > 0 then 'sending' else 'sent' end, total = n, queued_at = now(),
    finished_at = case when n > 0 then null else now() end, updated_at = now() where id = c.id;
  return n;
end $$;

-- The worker claims queued emails; skip locked means two overlapping runs never take the same email.
create or replace function public.claim_email_sends(p_limit int) returns setof public.email_sends
language sql security definer set search_path = '' as $$
  update public.email_sends s set status = 'sending', attempts = s.attempts + 1, claimed_at = now()
  where s.id in (
    select e.id from public.email_sends e join public.email_campaigns c on c.id = e.campaign_id
    where e.status = 'queued' and not e.is_test and c.status = 'sending' and (e.not_before is null or e.not_before <= now())
    order by e.queued_at, e.id limit p_limit for update of e skip locked)
  returning s.*
$$;

create or replace function public.finish_campaigns() returns void language sql security definer set search_path = '' as $$
  update public.email_campaigns c set status = 'sent', finished_at = now(), updated_at = now()
  where c.status = 'sending' and not exists (select 1 from public.email_sends s where s.campaign_id = c.id and not s.is_test and s.status in ('queued','sending'))
$$;

-- Put failed (and soft-bounced) emails back in the queue. Suppressed contacts are skipped and marked.
create or replace function public.requeue_failed(p_campaign uuid, p_ids uuid[] default null) returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  update public.email_sends s set status = 'suppressed', error = 'Contact is no longer active'
  where s.campaign_id = p_campaign and not s.is_test and s.status in ('failed','bounced') and (p_ids is null or s.id = any (p_ids))
    and not exists (select 1 from public.marketing_contacts m where m.id = s.contact_id and m.status = 'active');
  update public.email_sends s set status = 'queued', error = null, attempts = 0, not_before = null, claimed_at = null, queued_at = now(),
    failed_at = null, bounced_at = null
  where s.campaign_id = p_campaign and not s.is_test and s.status in ('failed','bounced') and (p_ids is null or s.id = any (p_ids));
  get diagnostics n = row_count;
  if n > 0 then update public.email_campaigns set status = 'sending', finished_at = null, updated_at = now() where id = p_campaign and status in ('sent','sending'); end if;
  return n;
end $$;

-- Record a Resend webhook event on the matching send. Status only ever moves forward (sent, delivered, opened, clicked) except bounce/complaint.
create or replace function public.apply_email_event(p_resend_id text, p_kind text, p_at timestamptz, p_error text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare sid uuid; ns text;
begin
  ns := case p_kind when 'sent' then 'sent' when 'delivered' then 'delivered' when 'opened' then 'opened' when 'clicked' then 'clicked'
    when 'bounced' then 'bounced' when 'complained' then 'complained' else null end;
  update public.email_sends s set
    sent_at = case when p_kind = 'sent' then coalesce(s.sent_at, p_at) else s.sent_at end,
    delivered_at = case when p_kind in ('delivered','opened','clicked') then coalesce(s.delivered_at, p_at) else s.delivered_at end,
    opened_at = case when p_kind in ('opened','clicked') then coalesce(s.opened_at, p_at) else s.opened_at end,
    clicked_at = case when p_kind = 'clicked' then coalesce(s.clicked_at, p_at) else s.clicked_at end,
    bounced_at = case when p_kind = 'bounced' then coalesce(s.bounced_at, p_at) else s.bounced_at end,
    complained_at = case when p_kind = 'complained' then coalesce(s.complained_at, p_at) else s.complained_at end,
    error = case when p_kind in ('bounced','complained') and p_error is not null then p_error else s.error end,
    status = case when ns is not null and public.email_status_rank(ns) > public.email_status_rank(s.status) then ns else s.status end
  where s.resend_id = p_resend_id returning s.id into sid;
  return sid;
end $$;

revoke all on function public.marketing_sync(), public.marketing_subscribe(text, text, text), public.queue_campaign(uuid), public.claim_email_sends(int),
  public.finish_campaigns(), public.requeue_failed(uuid, uuid[]), public.apply_email_event(text, text, timestamptz, text) from public, anon, authenticated;
grant execute on function public.marketing_sync(), public.marketing_subscribe(text, text, text), public.queue_campaign(uuid), public.claim_email_sends(int),
  public.finish_campaigns(), public.requeue_failed(uuid, uuid[]), public.apply_email_event(text, text, timestamptz, text) to service_role;
revoke all on function public.audience_contacts(jsonb), public.audience_count(jsonb), public.marketing_audience_summary(), public.email_campaign_stats() from public, anon;
grant execute on function public.audience_contacts(jsonb), public.audience_count(jsonb), public.marketing_audience_summary(), public.email_campaign_stats() to authenticated, service_role;

-- 6. Images for emails: public bucket (email apps must be able to load them), staff-only uploads -----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('email-images', 'email-images', true, 5242880, array['image/webp','image/jpeg','image/png','image/gif'])
on conflict (id) do nothing;
create policy "Admins list email images" on storage.objects for select to authenticated using (bucket_id = 'email-images' and public.is_admin());
create policy "Admins upload email images" on storage.objects for insert to authenticated with check (bucket_id = 'email-images' and public.is_admin());
create policy "Admins update email images" on storage.objects for update to authenticated using (bucket_id = 'email-images' and public.is_admin());
create policy "Admins delete email images" on storage.objects for delete to authenticated using (bucket_id = 'email-images' and public.is_admin());
