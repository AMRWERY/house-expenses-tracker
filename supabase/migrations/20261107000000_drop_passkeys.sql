-- Remove fingerprint / Face ID (passkey) sign-in.
-- Run once in the Supabase dashboard (SQL Editor), AFTER 20261106120000_email_auth.sql.
-- Accounts (Supabase Auth: email + password) and expenses are untouched.

drop table if exists public.webauthn_challenges;
drop table if exists public.passkeys;
