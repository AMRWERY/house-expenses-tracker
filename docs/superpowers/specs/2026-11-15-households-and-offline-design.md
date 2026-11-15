# Shared households, expense splitting, and PWA/offline — design

Written before implementation, as the roadmap requires (§0 rule 15, §2.14, §2.15, release 5).
Status: approved by the request to implement roadmap releases 1–5. Choices below are the implementer's calls, marked **(call)**.

## 1. Shared households

### Intent
Several family members manage one set of expenses. Today every row is scoped by `user_id`. After this change every
shared row is scoped by `household_id`, and `user_id` is only "who created it".

### Goals / non-goals
- Goals: households with roles; invitations; membership resolved **on the server for every request**; creator/payer tracking;
  every existing user keeps their data in a **personal household** (private option); no data loss in migration.
- Non-goals: email delivery of invitations (there is no mail service), billing, per-member private categories inside a shared
  household, cross-household reports.
- Anti-goal: trusting a `household_id` from the client. The client may only *ask* for a household (cookie `active_household`);
  the server checks membership and role each time and falls back to the user's personal household.

### Data model (migration `20261116000000_households.sql`, additive)
- `households(id, name, owner_id, personal, created_at, updated_at)`; one personal household per user (partial unique index).
- `household_members(household_id, user_id, role, joined_at)`; role ∈ owner | admin | member | viewer. Removing a member deletes the row.
- `household_invitations(id, household_id, email, role, invited_by, expires_at, accepted_at, declined_at, revoked_at, created_at)`.
  **(call)** No secret token: an invitation is bound to the invitee's **verified account email** (Supabase confirms emails), so
  accepting requires being signed in as that address. No token can leak or be forwarded. Expiry: 7 days.
- `household_id uuid NOT NULL` added to: expenses, incomes, categories, category_seed_done, month_amounts, budget_alerts,
  expense_templates, recurring_expenses, recurring_occurrences, user_settings (rollover is a household budget setting).
  Backfilled from the owner's personal household, then made NOT NULL.
- `expenses.created_by`, `expenses.paid_by`, `incomes.created_by`: the member who recorded it / who paid.
- Uniqueness moves from `(user_id, …)` to `(household_id, …)` for categories, month_amounts, user_settings.
  `budget_alerts` stays per member *and* household (an announcement is personal).
- `user_id` on shared tables becomes nullable with `ON DELETE SET NULL`, so deleting one member's account never deletes
  household data. `household_id` is `ON DELETE CASCADE` (deleting a household deletes its data).

### Permissions **(call)**
| Action | viewer | member | admin | owner |
|---|---|---|---|---|
| read everything in the household | ✔ | ✔ | ✔ | ✔ |
| add expenses/income/templates/recurring, confirm occurrences | | ✔ | ✔ | ✔ |
| edit/delete **own** expenses & income | | ✔ | ✔ | ✔ |
| edit/delete **anyone's** | | | ✔ | ✔ |
| categories, budgets, monthly amount, rollover, backup restore | | | ✔ | ✔ |
| invite (member/viewer), revoke invitations, remove members, change roles member↔viewer | | | ✔ | ✔ |
| promote to admin, transfer ownership, delete household | | | | ✔ |
Personal households: the user is the owner; nobody else can join one.

### Lifecycle rules
- Owner cannot leave: transfer ownership first (old owner becomes admin) or delete the household.
- Deleting a user's account (done in Supabase, not in this app) cascades their personal household; their shared-household
  records stay (created_by/paid_by become NULL, shown as "former member"). Shared households they own must be transferred first.
- Member removal never rewrites history: expenses keep `created_by`/`paid_by`; split rows keep the participant id.
- Invitations: pending → accepted | declined | revoked | expired. Accept/decline only by the matching verified email.
  Inviting the same email twice while one is pending is a 409. Max 10 members per household.

### Server
`requireScope(event, minimumRole)` replaces `requireUserSession` + `user.id` in every route. It returns
`{ userId, householdId, role }`. Every util takes that scope and filters `household_id`.

## 2. Expense splitting
Equal split first. A split lives in `expense_splits(expense_id, user_id, share, settled_at, settled_by)` plus an append-only
`expense_split_log` (who settled/unsettled when) so settlement is auditable.
- Shares are computed in integer cents: `floor(total/n)` each, the remainder cents go one by one to the first participants in
  a stable order, so **shares always sum exactly to the amount**.
- The payer's own share is settled from the start. Others settle by tapping "settled" (anyone with write access; logged).
- Editing the amount re-splits the same participants **only if nothing is settled yet**; otherwise 409 `split_locked`.
- "Who owes whom": for each pair, unsettled amounts are netted both ways. No payments are initiated.

## 3. PWA and offline (release 5)
- **Installable:** `manifest.webmanifest` (name, icons, standalone, theme), a hand-written service worker (no new dependency).
- **Caching rules (privacy):** the worker caches the built app shell and static assets only. It **never caches `/api/*`**,
  so financial data is not stored by the worker. Navigations are network-first with an offline fallback page.
- **Offline writes — scope:** only *adding an expense* works offline (the common case). Editing/deleting need a connection.
  Adds go to a local queue (`localStorage`, per signed-in user id + household) with a client-generated `client_id` (uuid).
- **Sync/idempotency:** `expenses.client_id uuid` with a unique index `(household_id, client_id)`. The server's create uses
  insert-or-return-existing, so a retried or double-flushed request never duplicates. The queue flushes in order when the
  browser is back online and on app start; a rejected item (validation error) is kept, flagged, and shown, never silently dropped.
- Conflicts: adds never conflict (new rows). Anything else is online-only, so there is no merge logic to get wrong.
- Sign-out clears the queue's UI state; the queue itself is keyed by user so another person on the same device never syncs it.
