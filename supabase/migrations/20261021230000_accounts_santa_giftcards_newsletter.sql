-- Customer data synced per signed-in user
create table public.user_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null check (key in ('recipients','wishlist','people','scheduled','profile')),
  value jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);
alter table public.user_data enable row level security;
create policy "Own data read" on public.user_data for select to authenticated using (user_id = (select auth.uid()));
create policy "Own data insert" on public.user_data for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Own data update" on public.user_data for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Own data delete" on public.user_data for delete to authenticated using (user_id = (select auth.uid()));
create policy "Customers read own orders" on public.orders for select to authenticated
  using (lower(customer->>'email') = lower((select auth.jwt()->>'email')));
create table public.newsletter_subscribers (email text primary key, source text, created_at timestamptz not null default now());
alter table public.newsletter_subscribers enable row level security;
create policy "Admins read subscribers" on public.newsletter_subscribers for select to authenticated using (public.is_admin());
create table public.gift_cards (
  code text primary key, amount integer not null check (amount > 0), balance integer not null check (balance >= 0),
  status text not null default 'pending' check (status in ('pending','active','void')),
  order_ref text, to_name text, to_email text, message text, send_on date, created_at timestamptz not null default now()
);
alter table public.gift_cards enable row level security;
create policy "Admins read gift cards" on public.gift_cards for select to authenticated using (public.is_admin());
alter table public.orders add column if not exists gift_card_code text, add column if not exists gift_card_applied integer not null default 0, add column if not exists payable integer;
create table public.santa_exchanges (
  id text primary key, code text not null unique, version integer not null default 0, data jsonb not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.santa_exchanges enable row level security;
create policy "Admins read santa" on public.santa_exchanges for select to authenticated using (public.is_admin());
