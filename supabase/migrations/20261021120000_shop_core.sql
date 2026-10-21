-- Applied to project zstplraslhhkfyiapjdm on 21 Oct 2026. Kept here as the record of the schema.
create table public.products (id text primary key, slug text unique not null, name text not null, price integer not null check (price >= 0), category text not null, active boolean not null default true, confirmed boolean not null default false, details jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now());
create table public.delivery_fees (state text primary key, fee integer not null check (fee >= 0));
create table public.promo_codes (code text primary key, percent integer not null check (percent between 1 and 90), active boolean not null default true);
create table public.orders (id uuid primary key default gen_random_uuid(), ref text unique not null, status text not null default 'pending_payment' check (status in ('pending_payment','paid','packed','out_for_delivery','delivered','cancelled','payment_failed')), customer jsonb not null, recipient jsonb not null, send_to text not null default 'someone' check (send_to in ('someone','me')), items jsonb not null, subtotal integer not null, discount integer not null default 0, delivery_fee integer not null, total integer not null, promo_code text, paystack_reference text unique, paid_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index orders_customer_email_idx on public.orders ((lower(customer->>'email')));
alter table public.products enable row level security;
alter table public.delivery_fees enable row level security;
alter table public.promo_codes enable row level security;
alter table public.orders enable row level security;
-- Orders and promo codes have no policies on purpose: only the Edge Functions (service role) touch them.
create policy "Public can read active products" on public.products for select to anon, authenticated using (active);
create policy "Public can read delivery fees" on public.delivery_fees for select to anon, authenticated using (true);
create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end $$;
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
insert into public.delivery_fees (state, fee) values ('Lagos',5000),('FCT Abuja',9000),('Ogun',8000),('Oyo',10000),('Rivers',12000),('Edo',12000),('Enugu',12000),('Kano',15000),('Other states',15000);
insert into public.promo_codes (code, percent) values ('MOMENTS10', 10);
