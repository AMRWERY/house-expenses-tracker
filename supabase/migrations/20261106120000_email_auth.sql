-- Move accounts to Supabase Auth (email + password).
-- Run once in the Supabase dashboard (SQL Editor), AFTER 20261106000000_init.sql.
--
-- Before: our own `app_users` table (name-only accounts created with a passkey).
-- After:  the account IS the Supabase Auth user (auth.users: email, hashed password, confirmation).
--         `passkeys` (fingerprint / Face ID linked to that account) and `expenses` point at auth.users,
--         so a passkey and an email account are the same person by construction.
--
-- Data note: the earlier name-only accounts can't exist in auth.users, so their passkeys and expenses
-- are removed. (The tables were empty / test data only when this was written.)

delete from public.passkeys;
delete from public.expenses;

alter table public.passkeys drop constraint if exists passkeys_user_id_fkey;
alter table public.expenses drop constraint if exists expenses_user_id_fkey;

alter table public.passkeys
  add constraint passkeys_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.expenses
  add constraint expenses_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

drop table if exists public.app_users;
