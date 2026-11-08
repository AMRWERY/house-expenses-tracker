-- The main amount a person sets for each month (e.g. 8000 or 10000).
-- Run once in the Supabase dashboard (SQL Editor), AFTER 20261110000000_category_budget.sql.
--
-- One row per person per month, so a new month simply has no row yet (the app asks for it).
-- `m` is 0-based like the expenses table (0 = January). What's left (amount minus the month's expenses)
-- and what is set aside in category budgets are computed in the app.

create table if not exists public.month_amounts (
  user_id     uuid not null references auth.users(id) on delete cascade,
  y           smallint not null check (y between 2000 and 2100),
  m           smallint not null check (m between 0 and 11),
  amount      numeric(12,2) not null check (amount > 0 and amount <= 1000000000),
  updated_at  timestamptz not null default now(),
  primary key (user_id, y, m)
);

alter table public.month_amounts enable row level security;
revoke all on public.month_amounts from anon, authenticated;
