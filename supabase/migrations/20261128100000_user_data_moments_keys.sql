-- Let the Gift Calendar sync the moments a customer follows and their own occasions (e.g. "Bicycle Day").
-- Both stay private to the account (existing row-level security on user_data).
alter table public.user_data drop constraint if exists user_data_key_check;
alter table public.user_data add constraint user_data_key_check
  check (key in ('recipients','wishlist','people','scheduled','profile','moments','custom_moments'));
