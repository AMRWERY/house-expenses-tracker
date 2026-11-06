-- House Expenses Tracker: initial schema.
-- Run once in the Supabase dashboard (SQL Editor), or with the Supabase CLI: `supabase db push`.
--
-- Access model: only the Nuxt server touches these tables, using the *secret* (service role) key, and it
-- scopes every query to the signed-in user. Row Level Security is switched ON with no policies, and the
-- public roles are revoked, so the publishable (anon) key can read and write nothing here.

create extension if not exists pgcrypto;

-- ---- Accounts ------------------------------------------------------------------------------------------
create table if not exists public.app_users (
  id           uuid primary key default gen_random_uuid(),
  user_name    text not null unique check (user_name = lower(user_name) and char_length(user_name) between 2 and 40),
  display_name text not null check (char_length(display_name) between 1 and 40),
  created_at   timestamptz not null default now()
);

-- ---- Passkeys (WebAuthn credentials): fingerprint / Face ID ---------------------------------------------
create table if not exists public.passkeys (
  id          text primary key,                                  -- credential id (base64url)
  user_id     uuid not null references public.app_users(id) on delete cascade,
  public_key  text not null,                                     -- base64url COSE public key
  counter     bigint not null default 0,                         -- signature counter
  backed_up   boolean not null default false,
  transports  text[],
  aaguid      text,
  created_at  timestamptz not null default now()
);
create index if not exists passkeys_user_id_idx on public.passkeys(user_id);

-- ---- One-time WebAuthn challenges (consumed on use, expire after a few minutes) ----------------------
create table if not exists public.webauthn_challenges (
  attempt_id  text primary key,
  challenge   text not null,
  expires_at  timestamptz not null
);
create index if not exists webauthn_challenges_expires_idx on public.webauthn_challenges(expires_at);

-- ---- Expenses ---------------------------------------------------------------------------------------------
create table if not exists public.expenses (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.app_users(id) on delete cascade,
  cat         text not null check (cat in ('groceries','bills','transport','health','education','fun','other')),
  amount      numeric(12,2) not null check (amount > 0 and amount <= 1000000000),
  y           smallint not null check (y between 2000 and 2100),
  m           smallint not null check (m between 0 and 11),      -- 0 = January (matches JavaScript)
  day         smallint not null check (day between 1 and 31),
  note        text check (note is null or char_length(note) <= 80),
  created_at  timestamptz not null default now()
);
create index if not exists expenses_user_month_idx on public.expenses(user_id, y, m);

-- ---- Lock everything down ---------------------------------------------------------------------------------
alter table public.app_users           enable row level security;
alter table public.passkeys            enable row level security;
alter table public.webauthn_challenges enable row level security;
alter table public.expenses            enable row level security;

revoke all on public.app_users, public.passkeys, public.webauthn_challenges, public.expenses from anon, authenticated;
