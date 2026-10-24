-- Admin dashboard: manual setup checklist + a staff-only view of the scheduled jobs.

create table if not exists public.admin_checklist (
  key text primary key,
  done boolean not null default false,
  done_by text,
  done_at timestamptz not null default now()
);
alter table public.admin_checklist enable row level security;
create policy "Admins read checklist" on public.admin_checklist for select to authenticated using (public.is_admin());
create policy "Admins add checklist" on public.admin_checklist for insert to authenticated with check (public.is_admin());
create policy "Admins update checklist" on public.admin_checklist for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- When did each scheduled job (email worker every minute, daily reminders) last run, and did it work?
create or replace function public.admin_cron_status() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'name', j.jobname,
    'active', j.active,
    'last_run', (select max(d.start_time) from cron.job_run_details d where d.jobid = j.jobid),
    'last_status', (select d.status from cron.job_run_details d where d.jobid = j.jobid order by d.start_time desc limit 1)
  )), '[]'::jsonb)
  from cron.job j
  where public.is_admin();
$$;
revoke all on function public.admin_cron_status() from public, anon;
grant execute on function public.admin_cron_status() to authenticated;
