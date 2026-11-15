-- Release 2: merchant, payment method, receipts, budget alerts, templates, recurring expenses.
-- Run once in the Supabase dashboard (SQL Editor) or with `supabase db push`, AFTER 20261113000000_avatars.sql.
-- Everything is additive: existing expenses stay valid (the new columns are optional).
--
-- Access model is unchanged: only the Nuxt server touches these tables with the secret key and scopes every
-- query to the signed-in user. RLS is ON with no policies, and the public roles are revoked.

-- ---- Expenses: merchant, payment method (a label only, never card details), receipt ------------------------
alter table public.expenses add column if not exists merchant text;
alter table public.expenses add column if not exists payment_method text;
alter table public.expenses add column if not exists receipt_path text;

alter table public.expenses drop constraint if exists expenses_merchant_check;
alter table public.expenses add constraint expenses_merchant_check
  check (merchant is null or char_length(merchant) between 1 and 60);
alter table public.expenses drop constraint if exists expenses_payment_method_check;
alter table public.expenses add constraint expenses_payment_method_check
  check (payment_method is null or payment_method in ('cash','card','bank_transfer','wallet','other'));
alter table public.expenses drop constraint if exists expenses_receipt_path_check;
alter table public.expenses add constraint expenses_receipt_path_check
  check (receipt_path is null or char_length(receipt_path) <= 200);

-- ---- Budget alerts: the highest threshold already announced for a budget in a month -------------------------
-- scope = 'month' (the main amount) or a category reference (a default's key or a custom category id).
-- level 1 = 70%, 2 = 85%, 3 = 100% or more. A threshold is announced once per budget per month.
create table if not exists public.budget_alerts (
  user_id     uuid not null references auth.users(id) on delete cascade,
  scope       text not null check (char_length(scope) between 1 and 40),
  y           smallint not null check (y between 2000 and 2100),
  m           smallint not null check (m between 0 and 11),
  level       smallint not null check (level between 1 and 3),
  updated_at  timestamptz not null default now(),
  primary key (user_id, scope, y, m)
);

-- ---- Expense templates: reusable starting points; they never create an expense by themselves --------------
create table if not exists public.expense_templates (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 40),
  amount          numeric(12,2) check (amount is null or (amount > 0 and amount <= 1000000000)),
  cat             text not null check (char_length(cat) between 1 and 40),
  note            text check (note is null or char_length(note) <= 80),
  merchant        text check (merchant is null or char_length(merchant) between 1 and 60),
  payment_method  text check (payment_method is null or payment_method in ('cash','card','bank_transfer','wallet','other')),
  created_at      timestamptz not null default now()
);
create index if not exists expense_templates_user_idx on public.expense_templates(user_id);

-- ---- Recurring expenses ------------------------------------------------------------------------------------
-- A rule says what repeats and when. `next_due` is the one occurrence waiting for the person's confirmation
-- (null once the rule has run past its end date). Nothing is added to the expenses until they confirm.
-- A paused rule (active = false) keeps its history. `anchor_day` is the day of the month the rule was created on,
-- so a rule on the 31st lands on the last day of shorter months and returns to the 31st afterwards.
create table if not exists public.recurring_expenses (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  title              text not null check (char_length(title) between 1 and 60),
  amount             numeric(12,2) not null check (amount > 0 and amount <= 1000000000),
  cat                text not null check (char_length(cat) between 1 and 40),
  note               text check (note is null or char_length(note) <= 80),
  merchant           text check (merchant is null or char_length(merchant) between 1 and 60),
  payment_method     text check (payment_method is null or payment_method in ('cash','card','bank_transfer','wallet','other')),
  frequency          text not null check (frequency in ('daily','weekly','monthly','yearly')),
  interval_count     smallint not null default 1 check (interval_count between 1 and 365),
  start_date         date not null,
  next_due           date,
  end_date           date check (end_date is null or end_date >= start_date),
  active             boolean not null default true,
  remind_days_before smallint not null default 1 check (remind_days_before between 0 and 30),
  last_reminded_for  date,   -- the occurrence a reminder was last announced for (so it is announced once)
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists recurring_expenses_user_idx on public.recurring_expenses(user_id);

-- One row per handled occurrence. The unique key is what makes confirming idempotent: a retry or a second tap
-- cannot create the same occurrence twice. Deleting a rule never deletes the expenses it produced.
create table if not exists public.recurring_occurrences (
  id              bigint generated always as identity primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  rule_id         uuid not null references public.recurring_expenses(id) on delete cascade,
  scheduled_date  date not null,
  status          text not null check (status in ('confirmed','skipped')),
  expense_id      bigint references public.expenses(id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (rule_id, scheduled_date)
);
create index if not exists recurring_occurrences_user_idx on public.recurring_occurrences(user_id);

-- ---- Lock everything down ---------------------------------------------------------------------------------
alter table public.budget_alerts         enable row level security;
alter table public.expense_templates     enable row level security;
alter table public.recurring_expenses    enable row level security;
alter table public.recurring_occurrences enable row level security;
revoke all on public.budget_alerts, public.expense_templates, public.recurring_expenses, public.recurring_occurrences
  from anon, authenticated;

-- ---- Receipts: one private file per expense (the server also creates the bucket on first use) --------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('receipts', 'receipts', false, 2097152)
on conflict (id) do nothing;
