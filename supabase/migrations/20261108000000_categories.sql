-- Custom expense categories (each person manages their own).
-- Run once in the Supabase dashboard (SQL Editor), AFTER 20261107000000_drop_passkeys.sql.
--
-- The 7 built-in categories (groceries, bills, ...) stay in code. An expense's `cat` is either one of
-- those keys or the id (uuid) of one of the person's custom categories, so the old fixed-list CHECK
-- on expenses.cat is replaced by a length check; the API validates the value against the owner's categories.

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 24),
  color       text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  icon        text not null check (char_length(icon) between 1 and 24),
  created_at  timestamptz not null default now()
);
create index if not exists categories_user_idx on public.categories(user_id);

alter table public.expenses drop constraint if exists expenses_cat_check;
alter table public.expenses drop constraint if exists expenses_cat_length;
alter table public.expenses add constraint expenses_cat_length check (char_length(cat) between 1 and 40);

alter table public.categories enable row level security;
revoke all on public.categories from anon, authenticated;
