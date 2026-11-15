-- Release 4: shared households, creator/payer tracking, expense splitting.
-- Run once in the Supabase dashboard (SQL Editor) or with `supabase db push`, AFTER 20261115000000_release_3.sql.
-- Design: docs/superpowers/specs/2026-11-15-households-and-offline-design.md
--
-- What changes: every shared row gets a `household_id`. Every existing person keeps their data in a PERSONAL household
-- created here (nothing is lost, nothing is renamed). `user_id` on shared rows becomes "who created it" and is set to NULL
-- if that account is deleted, so deleting one member never deletes the household's data.
-- Access model is unchanged: only the Nuxt server touches these tables (secret key); it resolves membership and role on
-- every request. RLS is ON with no policies and the public roles are revoked.

-- ---- Households, members, invitations -------------------------------------------------------------------------
create table if not exists public.households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 40),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  personal    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
-- exactly one personal household per person
create unique index if not exists households_one_personal_idx on public.households(owner_id) where personal;

create table if not exists public.household_members (
  household_id  uuid not null references public.households(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          text not null check (role in ('owner','admin','member','viewer')),
  joined_at     timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index if not exists household_members_user_idx on public.household_members(user_id);

-- An invitation is bound to the invitee's verified account email (no secret token to leak or forward).
create table if not exists public.household_invitations (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  email         text not null check (email = lower(email) and char_length(email) between 3 and 254),
  role          text not null check (role in ('admin','member','viewer')),
  invited_by    uuid references auth.users(id) on delete set null,
  expires_at    timestamptz not null,
  accepted_at   timestamptz,
  declined_at   timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz not null default now()
);
-- one open invitation per household and email
create unique index if not exists household_invitations_pending_idx
  on public.household_invitations(household_id, email)
  where accepted_at is null and declined_at is null and revoked_at is null;
create index if not exists household_invitations_email_idx on public.household_invitations(email);

-- ---- A personal household for every existing person ------------------------------------------------------------
insert into public.households (owner_id, name, personal)
select u.id, 'Personal', true from auth.users u
on conflict (owner_id) where personal do nothing;

insert into public.household_members (household_id, user_id, role)
select h.id, h.owner_id, 'owner' from public.households h where h.personal
on conflict do nothing;

-- ---- household_id on every shared table (backfilled from the owner's personal household) -------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'expenses','incomes','categories','category_seed_done','month_amounts','budget_alerts',
    'expense_templates','recurring_expenses','recurring_occurrences','user_settings'
  ] loop
    execute format('alter table public.%I add column if not exists household_id uuid references public.households(id) on delete cascade', t);
    execute format(
      'update public.%I x set household_id = h.id from public.households h where h.owner_id = x.user_id and h.personal and x.household_id is null', t);
    execute format('alter table public.%I alter column household_id set not null', t);
    execute format('create index if not exists %I on public.%I(household_id)', t || '_household_idx', t);
  end loop;
end $$;

-- ---- Keys that were per person are now per household ---------------------------------------------------------------
-- categories: one default key per household
drop index if exists public.categories_user_key_idx;
create unique index if not exists categories_household_key_idx on public.categories(household_id, key);

-- month_amounts, category_seed_done, user_settings: one row per household
alter table public.month_amounts drop constraint if exists month_amounts_pkey;
alter table public.month_amounts add primary key (household_id, y, m);
alter table public.category_seed_done drop constraint if exists category_seed_done_pkey;
alter table public.category_seed_done add primary key (household_id);
alter table public.user_settings drop constraint if exists user_settings_pkey;
alter table public.user_settings add primary key (household_id);

-- budget_alerts: an announcement is personal (each member is told once), so the key is per member AND household
alter table public.budget_alerts drop constraint if exists budget_alerts_pkey;
alter table public.budget_alerts add primary key (user_id, household_id, scope, y, m);

-- ---- user_id on shared rows = "who created it"; deleting that account keeps the household's data -----------------
do $$
declare t text;
begin
  foreach t in array array[
    'expenses','incomes','categories','category_seed_done','month_amounts',
    'expense_templates','recurring_expenses','recurring_occurrences','user_settings'
  ] loop
    execute format('alter table public.%I alter column user_id drop not null', t);
    execute format('alter table public.%I drop constraint if exists %I', t, t || '_user_id_fkey');
    execute format(
      'alter table public.%I add constraint %I foreign key (user_id) references auth.users(id) on delete set null', t, t || '_user_id_fkey');
  end loop;
end $$;

-- ---- Who recorded and who paid -------------------------------------------------------------------------------------
alter table public.expenses add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.expenses add column if not exists paid_by uuid references auth.users(id) on delete set null;
update public.expenses set created_by = user_id where created_by is null;
update public.expenses set paid_by = user_id where paid_by is null;
alter table public.incomes add column if not exists created_by uuid references auth.users(id) on delete set null;
update public.incomes set created_by = user_id where created_by is null;

-- ---- Expense splitting ----------------------------------------------------------------------------------------------
-- One row per participant. `user_id` has no foreign key on purpose: when a member leaves, the split they were part of is
-- history and is never rewritten. Shares are computed in cents and always add up to the expense amount.
create table if not exists public.expense_splits (
  expense_id    bigint not null references public.expenses(id) on delete cascade,
  household_id  uuid not null references public.households(id) on delete cascade,
  user_id       uuid not null,
  share         numeric(12,2) not null check (share >= 0 and share <= 1000000000),
  settled_at    timestamptz,
  settled_by    uuid,
  primary key (expense_id, user_id)
);
create index if not exists expense_splits_household_idx on public.expense_splits(household_id);

-- Append-only record of settlements, so who settled what, and when, can always be explained.
create table if not exists public.expense_split_log (
  id             bigint generated always as identity primary key,
  expense_id     bigint not null references public.expenses(id) on delete cascade,
  household_id   uuid not null references public.households(id) on delete cascade,
  participant_id uuid not null,
  action         text not null check (action in ('settled','unsettled')),
  by_user        uuid,
  created_at     timestamptz not null default now()
);
create index if not exists expense_split_log_expense_idx on public.expense_split_log(expense_id);

-- ---- Lock everything down --------------------------------------------------------------------------------------------
alter table public.households            enable row level security;
alter table public.household_members     enable row level security;
alter table public.household_invitations enable row level security;
alter table public.expense_splits        enable row level security;
alter table public.expense_split_log     enable row level security;
revoke all on public.households, public.household_members, public.household_invitations,
  public.expense_splits, public.expense_split_log from anon, authenticated;
