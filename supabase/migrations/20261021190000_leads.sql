-- Enquiries from the website: contact form, corporate consultation, (later) quote requests.
-- Only the "leads" edge function (service role) writes here. Nobody can read it from the browser.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  kind text not null check (kind in ('contact', 'consultation', 'quote')),
  name text not null,
  email text not null,
  phone text,
  company text,
  role text,
  quantity text,
  required_by date,
  enquiry_type text,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'won', 'lost')),
  notified boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists leads_created_idx on public.leads (created_at desc);
create index if not exists leads_email_idx on public.leads (lower(email), created_at desc);
alter table public.leads enable row level security;
