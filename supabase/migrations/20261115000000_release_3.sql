-- Release 3: income tracking and opt-in budget rollover.
-- Run once in the Supabase dashboard (SQL Editor) or with `supabase db push`, AFTER 20261114000000_release_2.sql.
-- Additive only. Same access model as before: only the Nuxt server touches these tables (secret key), scoped to the user.

-- ---- Income ------------------------------------------------------------------------------------------------
-- Income lives in its own table so it can never be mistaken for an expense or reduce a category budget.
-- It is separate from the monthly "main amount", which stays a spending amount / limit.
create table if not exists public.incomes (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  amount      numeric(12,2) not null check (amount > 0 and amount <= 1000000000),
  y           smallint not null check (y between 2000 and 2100),
  m           smallint not null check (m between 0 and 11),      -- 0 = January (matches JavaScript)
  day         smallint not null check (day between 1 and 31),
  source      text not null check (source in ('salary','freelance','gift','refund','other')),
  note        text check (note is null or char_length(note) <= 80),
  created_at  timestamptz not null default now()
);
create index if not exists incomes_user_month_idx on public.incomes(user_id, y, m);

-- ---- Settings: one row per person ----------------------------------------------------------------------------
-- Rollover is OFF by default. When a person turns it on, `rollover_since_*` records the month it started: unused category
-- budget carries forward from that month on (never backwards into history). Overspending is not carried over.
create table if not exists public.user_settings (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  rollover_enabled  boolean not null default false,
  rollover_since_y  smallint check (rollover_since_y is null or rollover_since_y between 2000 and 2100),
  rollover_since_m  smallint check (rollover_since_m is null or rollover_since_m between 0 and 11),
  updated_at        timestamptz not null default now()
);

alter table public.incomes       enable row level security;
alter table public.user_settings enable row level security;
revoke all on public.incomes, public.user_settings from anon, authenticated;
