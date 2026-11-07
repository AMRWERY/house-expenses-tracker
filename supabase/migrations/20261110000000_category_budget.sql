-- Monthly budget per category (optional).
-- Run once in the Supabase dashboard (SQL Editor), AFTER 20261109000000_editable_default_categories.sql.
-- null = no budget. What's left is computed in the app: budget minus that month's expenses in the category.

alter table public.categories add column if not exists budget numeric(12,2);
alter table public.categories drop constraint if exists categories_budget_check;
alter table public.categories add constraint categories_budget_check
  check (budget is null or (budget >= 0 and budget <= 1000000000));
