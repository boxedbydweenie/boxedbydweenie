-- Remember the design a buyer chose for each gift card, so the email matches it.
alter table public.gift_cards add column if not exists design text;
