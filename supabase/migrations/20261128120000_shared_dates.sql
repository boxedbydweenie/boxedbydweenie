-- "Add your dates" link: a Gift Calendar user shares a personal link; friends, family and colleagues
-- open it and add their own birthdays and anniversaries, which then appear in that user's calendar.

create table if not exists public.date_invites (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);
alter table public.date_invites enable row level security;
create policy "Own invite read" on public.date_invites for select to authenticated using (user_id = (select auth.uid()));

create table if not exists public.shared_dates (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  from_name text not null check (char_length(from_name) between 1 and 80),
  relationship text check (relationship is null or char_length(relationship) <= 30),
  dates jsonb not null check (jsonb_typeof(dates) = 'array' and jsonb_array_length(dates) between 1 and 8),
  likes text check (likes is null or char_length(likes) <= 300),
  created_at timestamptz not null default now(),
  imported_at timestamptz
);
create index if not exists shared_dates_owner_idx on public.shared_dates (owner, imported_at);
alter table public.shared_dates enable row level security;
create policy "Own shared dates read" on public.shared_dates for select to authenticated using (owner = (select auth.uid()));
create policy "Own shared dates update" on public.shared_dates for update to authenticated using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy "Own shared dates delete" on public.shared_dates for delete to authenticated using (owner = (select auth.uid()));

-- The signed-in user's personal link code (made on first use).
create or replace function public.my_date_invite_code()
returns text language plpgsql security definer set search_path = public as $$
declare v text; me uuid := auth.uid();
begin
  if me is null then raise exception 'sign in first'; end if;
  select code into v from date_invites where user_id = me;
  if v is null then
    loop
      v := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
      begin
        insert into date_invites (user_id, code) values (me, v);
        exit;
      exception when unique_violation then
        select code into v from date_invites where user_id = me;
        exit when v is not null;
      end;
    end loop;
  end if;
  return v;
end $$;
revoke all on function public.my_date_invite_code() from public, anon;
grant execute on function public.my_date_invite_code() to authenticated;

-- Public: the first name of whoever shared the link, for the form's greeting. Nothing else is exposed.
create or replace function public.date_invite_name(p_code text)
returns text language sql stable security definer set search_path = public, auth as $$
  select split_part(coalesce(nullif(trim(u.raw_user_meta_data->>'first_name'), ''), nullif(trim(u.raw_user_meta_data->>'name'), ''), 'Your friend'), ' ', 1)
  from date_invites i join auth.users u on u.id = i.user_id
  where i.code = lower(trim(p_code));
$$;
revoke all on function public.date_invite_name(text) from public;
grant execute on function public.date_invite_name(text) to anon, authenticated;

-- Public: someone adds their dates through a link. Checked and limited so the link can't be abused.
create or replace function public.submit_shared_dates(p_code text, p_name text, p_relationship text, p_dates jsonb, p_likes text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_owner uuid; d jsonb; clean jsonb := '[]'::jsonb; v_type text; v_day int; v_month int; v_year int; v_label text;
begin
  select user_id into v_owner from date_invites where code = lower(trim(p_code));
  if v_owner is null then raise exception 'This link is not valid.'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'Add your name.'; end if;
  if jsonb_typeof(p_dates) <> 'array' or jsonb_array_length(p_dates) = 0 then raise exception 'Add at least one date.'; end if;
  if (select count(*) from shared_dates where owner = v_owner and created_at > now() - interval '1 day') >= 100 then
    raise exception 'This link has had a lot of replies today. Please try again tomorrow.';
  end if;
  for d in select * from jsonb_array_elements(p_dates) limit 8 loop
    v_type := coalesce(d->>'type', 'custom');
    if v_type not in ('birthday', 'anniversary', 'custom') then v_type := 'custom'; end if;
    v_day := (d->>'day')::int; v_month := (d->>'month')::int;
    v_year := nullif(d->>'year', '')::int;
    v_label := left(trim(coalesce(d->>'label', '')), 60);
    if v_month not between 1 and 12 or v_day not between 1 and 31 then continue; end if;
    if v_year is not null and (v_year < 1900 or v_year > extract(year from now())::int) then v_year := null; end if;
    if v_label = '' then v_label := case v_type when 'birthday' then 'Birthday' when 'anniversary' then 'Anniversary' else 'Special day' end; end if;
    clean := clean || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object('type', v_type, 'label', v_label, 'day', v_day, 'month', v_month, 'year', v_year)));
  end loop;
  if jsonb_array_length(clean) = 0 then raise exception 'Check the dates and try again.'; end if;
  insert into shared_dates (owner, from_name, relationship, dates, likes)
  values (v_owner, left(trim(p_name), 80), nullif(left(trim(coalesce(p_relationship, '')), 30), ''), clean, nullif(left(trim(coalesce(p_likes, '')), 300), ''));
  return true;
end $$;
revoke all on function public.submit_shared_dates(text, text, text, jsonb, text) from public;
grant execute on function public.submit_shared_dates(text, text, text, jsonb, text) to anon, authenticated;
