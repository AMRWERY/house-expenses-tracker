-- Let a person delete their last remaining category.
-- Run once in the Supabase dashboard (SQL Editor), AFTER 20261111000000_month_amounts.sql.
--
-- A new account with zero categories is given the 7 defaults on first use. Without a marker, deleting
-- the last category would look like a new account and the defaults would come straight back. A row here
-- says "this person already had their categories and removed them all": do not seed again.

create table if not exists public.category_seed_done (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

alter table public.category_seed_done enable row level security;
revoke all on public.category_seed_done from anon, authenticated;
