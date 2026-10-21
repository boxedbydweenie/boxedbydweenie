-- Admin area: staff list, row-level security for staff, product image bucket.
alter table public.products add column if not exists in_stock boolean not null default true;
alter table public.products add column if not exists sort integer not null default 100;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'admin' check (role in ('owner','admin','staff')),
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy "Admins read staff list" on public.admin_users for select to authenticated using (public.is_admin());

create policy "Admins read all products" on public.products for select to authenticated using (public.is_admin());
create policy "Admins insert products" on public.products for insert to authenticated with check (public.is_admin());
create policy "Admins update products" on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete products" on public.products for delete to authenticated using (public.is_admin());

create policy "Admins read orders" on public.orders for select to authenticated using (public.is_admin());
create policy "Admins update orders" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins read leads" on public.leads for select to authenticated using (public.is_admin());
create policy "Admins update leads" on public.leads for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Admins manage delivery fees" on public.delivery_fees for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage promo codes" on public.promo_codes for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/webp','image/jpeg','image/png'])
on conflict (id) do nothing;
create policy "Admins upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
create policy "Admins update product images" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_admin());
create policy "Admins delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());
