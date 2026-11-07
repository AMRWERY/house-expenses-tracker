-- Make the 7 default categories editable and deletable, like any other category.
-- Run once in the Supabase dashboard (SQL Editor), AFTER 20261108000000_categories.sql.
--
-- Each person now has their OWN copy of the defaults, as rows in `categories` with `key` set
-- (groceries, bills, ...). `name` is null for a default that still uses its translated name; renaming
-- it stores the new name. Custom categories have `key` null and a required name.
-- An expense's `cat` stays: the default's key (e.g. 'groceries') or the custom category's id (uuid),
-- so no expense data changes.

alter table public.categories add column if not exists key text
  check (key is null or key in ('groceries','bills','transport','health','education','fun','other'));

alter table public.categories alter column name drop not null;
alter table public.categories drop constraint if exists categories_name_check;
alter table public.categories add constraint categories_name_check
  check (name is null or char_length(name) between 1 and 24);
alter table public.categories drop constraint if exists categories_custom_name;
alter table public.categories add constraint categories_custom_name
  check (key is not null or name is not null);

create unique index if not exists categories_user_key_idx on public.categories(user_id, key);

-- Give every existing account its defaults (dated far back so they sort before custom categories).
insert into public.categories (user_id, key, name, color, icon, created_at)
select u.id, d.key, null, d.color, d.key, timestamptz '2000-01-01' + (d.pos * interval '1 millisecond')
from auth.users u
cross join (values
  ('groceries', '#F97316', 1),
  ('bills',     '#EAB308', 2),
  ('transport', '#3B82F6', 3),
  ('health',    '#EC4899', 4),
  ('education', '#06B6D4', 5),
  ('fun',       '#F43F5E', 6),
  ('other',     '#64748B', 7)
) as d(key, color, pos)
on conflict (user_id, key) do nothing;
