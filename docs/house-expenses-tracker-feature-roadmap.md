# House Expenses Tracker — Feature Roadmap & Claude Code Implementation Brief

> **Purpose:** Give Claude Code a repository-specific plan for improving `AMRWERY/house-expenses-tracker` without losing the application's current simplicity.
>
> **Repository:** https://github.com/AMRWERY/house-expenses-tracker
>
> **Product direction:** A simple, calm, mobile-first household expense manager. Keep the interface easy to understand, support Arabic/English and RTL/LTR, support dark/light themes, and **do not add charts**.

---

## 0. Instructions for Claude Code

Before changing anything:

1. Read the current repository and inspect the relevant pages, components, stores, composables, API routes, database types, Supabase migrations, and `design.md`.
2. Treat the current implementation as the source of truth. Some items in this document may already have been partially implemented since the review; verify before adding them.
3. Do not duplicate existing functionality. Reuse existing components, stores, utilities, validation patterns, translations, and API conventions wherever possible.
4. Preserve the current visual identity and interaction patterns. Do not redesign the application unnecessarily.
5. Keep the UI minimal. Do not add charts, complex analytics dashboards, or unnecessary pages.
6. Use the existing stack and architecture unless a specific requirement makes a change necessary:
   - Nuxt 4
   - Vue 3 and TypeScript
   - Pinia
   - Tailwind CSS 4
   - Supabase/PostgreSQL accessed through Nuxt server API routes
   - `@nuxtjs/i18n` for Arabic and English
   - Existing theme and animation implementation
7. Never expose the Supabase secret/service-role key to browser code. Keep database access on the server and scope every user-owned query correctly.
8. Add database changes as new, ordered, additive Supabase migrations. Do not silently rewrite old migrations that may already have been applied.
9. Update `app/types/database.types.ts` after schema changes using the repository's existing database-type generation workflow. Verify generated types against the migrations.
10. Add complete Arabic and English translations for every user-facing string. Verify RTL layout, date/number formatting, and currency display in both languages.
11. Add loading, empty, error, success, disabled, and confirmation states where relevant. Keep keyboard accessibility, visible focus, labels, and reduced-motion support.
12. Validate all user input on the server, not only in Vue forms. Add database constraints and indexes where appropriate.
13. Add automated tests for important business logic and API behavior. Do not claim a test or build passes unless you actually ran it.
14. Implement the roadmap in phases. After each phase, run the available checks, fix regressions, and summarize changed files, migrations, tests, and anything unfinished.
15. Do not start a large architectural feature such as shared households or offline synchronization until its data model and migration strategy have been designed and documented.

### Definition of done for every feature

A feature is not complete until:

- It works on desktop and mobile.
- It works in Arabic (RTL) and English (LTR).
- It works in dark and light themes.
- It has appropriate loading, empty, success, and failure states.
- Client and server validation are implemented where applicable.
- User data is correctly isolated and authorization is enforced server-side.
- Database migrations and generated types are updated where needed.
- Relevant unit/integration tests are added and run.
- `design.md` and other relevant documentation match the implemented behavior.

---

# 1. Current repository baseline — already implemented

The following functionality was visible in the repository during the review. Re-check the current branch before modifying anything.

## 1.1 Authentication and profile

- User registration and login using email/password.
- Email confirmation flow.
- Change-password flow.
- Display-name editing.
- Profile picture upload, retrieval, and removal.
- Authenticated route handling and session cleanup.
- Basic in-memory auth rate limiting, alongside Supabase's own limits.

## 1.2 Expense management

- Add, edit, and delete expenses.
- Expense amount, category, date, and optional note.
- Expense rows grouped by category.
- Loading skeletons and empty states.
- Delete undo/restore behavior in the existing application flow.
- Server-side validation and user-scoped database queries.

## 1.3 Categories and budgets

- Seven initial/default categories.
- Custom categories.
- Category name, color, and icon customization.
- Category deletion and reassignment of existing expenses.
- Optional monthly budget for each category.
- Per-category budget status and remaining/over-budget amount.
- Overall category-budget allocation against the main monthly amount.

## 1.4 Monthly spending amount

- A separate main amount for each month.
- Monthly spent and remaining/over-budget calculations.
- A prompt to set the amount for a new month.
- Monthly amounts persisted through server API routes.

## 1.5 Filtering and comparison

- Month navigation.
- Category filter.
- Date-range filter.
- Monthly comparison page.
- Monthly average, highest month, lowest month, top category, and comparison percentage.

## 1.6 Preferences and user experience

- Arabic and English localization.
- RTL and LTR support.
- Dark and light themes.
- Page transitions, view transitions, animated numbers, and skeletons.
- Responsive layout and reusable UI components.
- Currency currently represented through existing app translations/formatting; verify the actual settings and behavior before extending it.

## 1.7 Important repository references

Use these as starting points, but inspect the current code before editing:

- Home page: `app/pages/index.vue`
- Monthly comparison page: `app/pages/compare/index.vue`
- Settings page: `app/pages/settings/index.vue`
- Expense store: `app/stores/expensesStore.ts`
- Categories store: `app/stores/categoriesStore.ts`
- Monthly amount store: `app/stores/monthAmountStore.ts`
- Comparison store: `app/stores/comparisonStore.ts`
- Auth store: `app/stores/authStore.ts`
- Expense server utilities: `server/utils/expenses.ts`
- Category server utilities: `server/utils/categories.ts`
- Monthly amount server utilities: `server/utils/monthAmounts.ts`
- Supabase server client: `server/utils/supabase.ts`
- Database types: `app/types/database.types.ts`
- Database migrations: `supabase/migrations/`
- Design specification: `design.md`

---

# 2. New features to implement

## Phase 1 — Improve the existing experience

These features should be implemented first because they provide meaningful value without requiring a major architectural change.

### 2.1 Expense search

**Goal:** Let users quickly find an existing expense.

Requirements:

- Add a compact search field to the expense list/home experience.
- Search expense notes/descriptions.
- Search merchant/store names when the merchant field is implemented.
- Support searching by an exact or partial amount where practical.
- Add optional minimum and maximum amount filters.
- Allow search to work together with the existing month, date-range, and category filters.
- Provide a clear-search action and a useful no-results state.
- Avoid adding a separate, complicated search page unless the current UI makes that necessary.
- Consider debouncing text input if searching becomes server-side.

**Acceptance criteria:**

- Searching returns only matching expenses.
- Search and existing filters combine correctly rather than unexpectedly replacing one another.
- Clearing search restores the previous filtered list.
- Search works in Arabic and English where applicable.
- The empty state distinguishes “no expenses exist” from “no search results found.”

### 2.2 Quick Add

**Goal:** Reduce the time needed to record a frequent expense.

Requirements:

- Provide a quick-entry experience using the existing expense sheet/form patterns.
- Preselect useful defaults such as today's date and the last-used category, if available.
- Keep the amount field easy to reach and focused when appropriate.
- Remember recent selections only where privacy and user expectations allow.
- Do not make the form confusing by exposing too many optional fields at once.

**Acceptance criteria:**

- A user can enter a normal expense with fewer interactions than the current full flow.
- Validation, loading, errors, and successful saving use the existing patterns.
- Arabic-Indic and Western digits are handled consistently with existing amount inputs.

### 2.3 Duplicate an expense

**Goal:** Make repeated one-off purchases faster to enter.

Requirements:

- Add a duplicate action to an existing expense's edit/details experience.
- Copy the category, amount, note/description, and merchant when available.
- Default the duplicated record's date to today, unless the user explicitly changes it.
- Never reuse the original database ID.
- Open the add flow with copied values so the user can review and save.
- Do not create a new expense until the user confirms by pressing Save/Add.

**Acceptance criteria:**

- Duplicating an expense never edits or deletes the source expense.
- The duplicate receives a new record ID after saving.
- The date default is clear and predictable.

### 2.4 Expense templates and frequently used expenses

**Goal:** Support expenses that happen often but do not have a fixed schedule.

Requirements:

- Allow a user to save an expense as a reusable template or mark an existing template/favorite.
- A template can include a suggested amount, category, note, and merchant when available.
- Allow editing and deleting templates.
- Provide a simple way to start a new expense from a template.
- Keep templates separate from actual expense records; using a template must not create a transaction until the user saves it.

**Acceptance criteria:**

- Templates are scoped to the correct user/household.
- Editing a template does not modify past expenses created from it.
- Template-based expenses follow normal validation and save behavior.

### 2.5 CSV export

**Goal:** Let users take their expense data to a spreadsheet.

Requirements:

- Export the currently selected month or date range.
- Provide an option to export all expenses.
- Include useful columns such as date, amount, currency, category, note/description, merchant, and payment method when those fields exist.
- Use stable date and decimal formats.
- Escape CSV values correctly, including commas, quotes, and newlines.
- Use a filename that includes the export type and date/month.
- Ensure Arabic text is preserved in common spreadsheet applications; consider UTF-8 BOM compatibility.
- Generate the export from authorized data only.

**Acceptance criteria:**

- The exported file opens correctly in common spreadsheet software.
- The export respects the selected filters when exporting a filtered selection.
- No other user's data can appear in the export.

### 2.6 Full JSON backup and restore

**Goal:** Give users a portable backup of their household expense data.

Requirements:

- Provide an explicit “Download backup” action.
- Include the user's supported data: expenses, categories, monthly amounts, templates, recurring rules, and related settings as those features are introduced.
- Include a backup version/schema version and export timestamp.
- Provide a restore/import flow that validates the file before changing data.
- Show a preview/summary of records to be imported.
- Define duplicate handling and conflict behavior clearly.
- Make restore transactional where possible: a failed restore must not leave partially imported data.
- Never trust IDs or ownership fields from an uploaded JSON file. Assign ownership based on the authenticated user or authorized household.
- Do not overwrite existing data silently. Offer a clearly explained merge or replace mode only if both can be implemented safely.

**Acceptance criteria:**

- Invalid or unsupported backup files are rejected with a readable error.
- Users can restore their own backup without importing another user's identity or ownership.
- The restore result is reported clearly.

### 2.7 Fix monthly comparison calculations

**Current concern:** The comparison store appears to build months only from months that contain expenses or a saved main amount. It may therefore skip calendar months with no records and compare against the previous available month rather than the immediately preceding calendar month.

Requirements:

- Generate a continuous calendar-month sequence for the displayed comparison period.
- Include months with no expenses as zero-spend months.
- Define clearly whether the current incomplete month is included in average/highest/lowest statistics; preserve the existing completed-month-only intent unless there is a strong reason to change it.
- Compare each month with the immediately previous calendar month.
- Handle division by zero (for example, previous month has zero expenses) without producing `Infinity`, `NaN`, or a misleading percentage.
- Include months with a main amount even if they have no expenses.
- Make labels and calculations consistent for Arabic and English.

**Acceptance criteria:**

- Consecutive empty months are not silently omitted.
- Month-over-month percentages are calculated against the correct calendar month.
- Zero-baseline comparisons have an explicit and understandable state.
- Existing comparison UI continues to work without introducing charts.

---

## Phase 2 — Smarter expense management

### 2.8 Recurring expenses

**Goal:** Help users manage predictable household payments such as rent, internet, subscriptions, and regular bills.

Requirements:

- Create, view, edit, pause, resume, and delete recurring expense rules.
- Support recurrence frequencies: daily, weekly, monthly, and yearly. Only expose frequencies that can be implemented reliably.
- Store the next due date, recurrence interval, optional end date, suggested amount, category, note/description, and merchant when available.
- Handle month-end dates safely (for example, a rule created on the 31st in a month with fewer days).
- Make the behavior for variable amounts explicit: allow the user to edit the amount before confirming an occurrence.
- Do not blindly create duplicate expenses when a user refreshes or retries.
- Use an idempotent occurrence model, such as a unique key per recurring rule and scheduled occurrence.
- Prefer a “Due” or “Upcoming” list with a clear “Confirm and add expense” action for the first implementation. Do not silently create a payment record without the user's understanding.
- If automatic creation is added later, make it opt-in and provide a clear audit trail.
- Account for the user's timezone when calculating due dates.

**Suggested data model (adapt after reviewing the current schema):**

- `recurring_expenses`: owner/household ID, title, amount, category reference, note, merchant, frequency, interval, start date, next due date, optional end date, active/paused state, created/updated timestamps.
- `recurring_occurrences`: recurring rule ID, scheduled date, generated expense ID when confirmed, status, and timestamps.
- Add a unique constraint that prevents creating the same occurrence twice.

**Acceptance criteria:**

- A recurring rule can be paused without deleting its history.
- A due occurrence can be confirmed only once.
- Editing or deleting a recurring rule does not corrupt already-recorded expenses.
- Due dates are correct around month ends, leap years, and timezone boundaries.

### 2.9 Due-date reminders

**Goal:** Remind users about upcoming recurring payments.

Requirements:

- Start with in-app reminders/indicators and a simple upcoming-payments list.
- Allow reminder timing to be configured, such as on the due date or a chosen number of days before.
- Avoid sending duplicate reminders for the same occurrence.
- Keep push/email notifications optional and defer them until a reliable notification delivery mechanism exists.

**Acceptance criteria:**

- Users can identify upcoming and overdue recurring payments.
- Reminder state is tied to a specific recurring occurrence.
- Notifications respect timezone and user preferences.

### 2.10 Budget alerts

**Goal:** Notify users when they approach or exceed their existing monthly or category budget limits.

Suggested default thresholds:

- 70%: approaching the limit.
- 85%: warning.
- 100% or more: budget reached/exceeded.

Requirements:

- Apply thresholds to category budgets and, where useful, the main monthly amount.
- Make thresholds configurable or provide sensible defaults.
- Prevent repeated alerts every time the page loads. Track whether a threshold has already been reached for a particular budget/month.
- Recalculate correctly when an expense is edited or deleted.
- Start with an in-app alert/toast or compact status message. Do not require browser push notifications for this phase.
- Do not rely on color alone; include text and an icon/state label.

**Acceptance criteria:**

- Each threshold is triggered once per relevant budget period unless the user explicitly resets it.
- Editing/deleting expenses updates the displayed budget status.
- Alerts are available in Arabic and English and work in both themes.

### 2.11 Merchant/store field

**Goal:** Record where the user made a purchase.

Requirements:

- Add an optional merchant/store field to an expense.
- Include it in add/edit forms, search, expense display, CSV export, and backup.
- Keep it optional to preserve fast entry.
- Consider a lightweight list of previously used merchant names for suggestions, without requiring a complex merchant directory.

**Acceptance criteria:**

- Existing expenses remain valid after the database migration.
- Merchant names can be searched.
- The field is optional and validated server-side.

### 2.12 Payment method

**Goal:** Let users understand how household expenses are paid.

Suggested methods:

- Cash
- Debit/credit card
- Bank transfer
- Mobile wallet
- Other

Requirements:

- Make the field optional.
- Allow users to customize labels later only if needed.
- Include payment method in search/filter/export/backup where appropriate.
- Do not collect card numbers, bank credentials, or other sensitive payment details.

**Acceptance criteria:**

- Only a payment-method label is stored; no card or banking credentials are collected.
- Existing records remain compatible.

### 2.13 Receipt attachments

**Goal:** Attach a receipt photo or file to an expense.

Requirements:

- Allow selecting an image from the device and taking a photo on supported mobile devices.
- Show a preview before upload and a preview when viewing an expense.
- Allow deleting/replacing the attachment.
- Validate file type and size on the server.
- Store files in a private storage bucket or equivalent protected object storage.
- Use authorized access/signed URLs; do not expose private receipts publicly.
- Keep the attachment optional.
- Design the data relationship so one expense can support one or more attachments if that is useful, but start with one attachment if it keeps the experience simpler.

**Future enhancement:** OCR can later suggest the merchant, date, and amount from an uploaded receipt. Do not make OCR a dependency for the initial receipt feature.

**Acceptance criteria:**

- Only the owning user/authorized household members can access a receipt.
- Deleting an expense or attachment follows a documented file-cleanup strategy.
- Upload failures do not leave broken attachment records.

---

## Phase 3 — Broader financial management

### 2.14 Income tracking

**Goal:** Track money coming into the household as well as expenses.

Requirements:

- Add income records with amount, date, source/category, and optional note.
- Keep income and expense records distinguishable in the UI and database.
- Provide simple totals for selected month/date range.
- Calculate net balance as:

  `Net balance = Total income - Total expenses`

- Do not change the existing monthly main amount concept without a deliberate product decision. It currently represents a spending amount/limit, not necessarily real income.
- Support editing and deleting income records.
- Include income in export and backup.
- Keep the user experience as simple as possible; no charts.

**Acceptance criteria:**

- Income does not accidentally appear as an expense or reduce category budgets.
- Monthly and date-range income totals are accurate.
- Net balance calculations handle empty periods correctly.

### 2.15 Monthly budget rollover

**Goal:** Optionally carry unused budget from one month into the next.

Requirements:

- Make rollover opt-in, not the default.
- Decide whether rollover applies to the main monthly amount, individual category budgets, or both. Prefer category-level rollover first if that better matches the current model.
- Store enough information to explain how the new month's budget was calculated.
- Prevent changing historical expenses from silently producing confusing changes in later months.
- Define how negative/overspent amounts carry forward (or whether negative values are ignored).
- Provide a clear display of base budget, rollover amount, and resulting available budget without adding a complicated dashboard.

**Acceptance criteria:**

- Users can understand where a month's available amount came from.
- Rollover calculations are deterministic and tested.
- Turning rollover off does not delete prior expense history.

### 2.16 Simple monthly financial summary

**Goal:** Give the user a short written summary, not a chart-heavy report.

Possible summary items:

- Total expenses this month.
- Total income and net balance if income tracking exists.
- Remaining main monthly amount.
- Number of recorded expenses.
- Highest-spending category.
- Difference from the previous calendar month.
- A small number of useful observations (for example, “Groceries were your highest category this month”).

Requirements:

- Use deterministic calculations from the user's data.
- Avoid claims that cannot be supported by the records.
- Do not add charts.
- Keep copy short and helpful, not judgmental.
- Support Arabic and English.

**Acceptance criteria:**

- Every statement can be traced to a correct calculation.
- Empty or incomplete months are explained correctly.

### 2.17 Spending-free days (optional, low priority)

**Goal:** Offer a lightweight view of days with no recorded expenses.

Requirements:

- Calculate days with no recorded expenses in a selected period.
- Clearly say “no expenses recorded” rather than claiming the user spent nothing, because missing records are possible.
- Avoid gamification that creates guilt or pressure.
- Keep this as a small statistic, not a chart.

**Acceptance criteria:**

- Calculations respect the selected date range and timezone.
- Copy does not imply that unrecorded spending did not happen.

---

## Phase 4 — Shared household and advanced capabilities

These features require careful architectural design. Do not treat them as small additions to the current single-user data model.

### 2.18 Shared household

**Goal:** Allow multiple family members to manage expenses within one household.

Requirements:

- A user can create a household.
- A household owner/admin can invite members.
- Members can accept/decline invitations.
- Define roles and permissions, for example:
  - Owner: full household control.
  - Admin: manage members and household settings.
  - Member: add and manage expenses according to the selected permission model.
  - Read-only: view data without editing.
- Associate household expenses, categories, budgets, templates, recurring rules, and related records with the household where appropriate.
- Track which member created or paid for an expense.
- Show the creator/payer where helpful.
- Support a personal/private household option if users need to keep some expenses private.
- Prevent users from accessing households they do not belong to.
- Handle invitation expiration, revocation, and member removal.
- Define what happens to household data when the owner leaves or deletes their account.

**Important architecture note:** The current schema and server utilities primarily scope data using `user_id`. Shared household support requires a deliberate ownership and authorization model, likely introducing a `households` table and `household_members` table and adding a household reference to shared records. Do not simply remove `user_id` filters or trust a `household_id` sent by the client. Resolve membership and permissions on the server for every request.

**Suggested initial model (adjust after schema review):**

- `households`: id, name, owner/user reference, currency, timezone, created/updated timestamps.
- `household_members`: household_id, user_id, role, status, joined_at.
- `household_invitations`: household_id, email or invite target, secure token hash, role, expiry, accepted/revoked timestamps.
- Add `household_id` to shared data tables where appropriate.
- Preserve audit fields such as `created_by` and `paid_by` where relevant.

**Acceptance criteria:**

- A member cannot read or modify another household's data without permission.
- Every server API checks membership and role.
- Ownership transfer and member removal are safe and tested.
- Existing single-user records are migrated or assigned to a personal household without data loss.

### 2.19 Expense splitting and member contributions

**Goal:** Track who owes or contributed what within a shared household.

Requirements:

- Allow an expense to be paid by one member and shared among selected members.
- Support equal splitting first.
- Consider custom amounts/percentages only after equal splitting works reliably.
- Track each member's share and settlement status.
- Provide a simple “who owes whom” summary.
- Do not automatically initiate payments or connect to banking/payment rails.

**Acceptance criteria:**

- Split totals always equal the original expense amount, including rounding remainder handling.
- Changes to membership do not rewrite historical split participants.
- Settlement state is auditable.

### 2.20 PWA and offline support

**Goal:** Let users install the application and record expenses when temporarily offline.

Requirements:

- First implement installability and a safe offline fallback.
- Cache only safe static application assets by default.
- Do not cache authenticated financial API responses in a shared/public cache.
- For offline expense entry, use a local pending queue with clear pending/synced/failed states.
- Synchronize when connectivity returns.
- Use idempotency keys so retries do not create duplicate expenses.
- Define conflict behavior for edits/deletes made on multiple devices.
- Provide a way for users to retry failed sync operations.
- Protect local financial data and provide a sign-out cleanup strategy.

**Acceptance criteria:**

- Refreshing while offline does not expose another user's cached information.
- Queued expenses are not duplicated after retry.
- Sync failures are visible and recoverable.
- Online behavior remains unchanged when offline mode is unavailable.

---

# 3. Small quality-of-life improvements

Implement these when they naturally fit into the phases above. Do not create unnecessary settings or screens for them.

1. **Favorite categories:** allow users to mark a few categories as favorites and show them first in the add-expense flow.
2. **Recently used categories:** optionally preselect or suggest the most recently used category.
3. **Monthly start day:** consider this only if users need budgeting periods that do not begin on the first calendar day. Define its effect on month navigation, comparisons, exports, and recurring dates before implementation.
4. **Currency settings:** allow a user/household to select a currency if multi-currency support is genuinely needed. Avoid simply changing the currency label while leaving historical values semantically incorrect. Define currency storage and conversion rules first.
5. **Simple merchant suggestions:** suggest previously entered merchant names without building a complicated merchant-management system.
6. **Clear notes:** preserve optional notes and make them searchable.
7. **Accessible status labels:** never communicate budget health through color alone.
8. **Helpful empty states:** distinguish no records, no filtered results, no search results, and no upcoming recurring payments.

---

# 4. Existing implementation issues and technical improvements

These are review findings to verify in the current branch before changing code.

## 4.1 Historical expense date restriction

**Observed concern:** `expensesStore.ts` defines a hard-coded `FIRST_MONTH` around November 2026 and uses it to prevent navigating/selecting earlier dates.

Requirements:

- Decide the intended earliest supported date.
- Prefer allowing users to enter historical expenses unless there is a clear product reason not to.
- If a limit is needed, make it configurable and document it.
- Update the date input's `min` value, month navigation, server validation, tests, and explanatory copy consistently.

**Acceptance criteria:**

- Users can enter valid historical expenses within the supported range.
- The UI and server agree on the supported date range.

## 4.2 Monthly comparison correctness

Implement the detailed requirements in Phase 1, section 2.7. Add tests for:

- A month with zero expenses.
- Multiple consecutive months with no expenses.
- Previous month with zero expenses.
- Current incomplete month.
- Month with only a monthly amount and no expenses.
- Year boundary (December to January).

## 4.3 Rate limiting in serverless environments

**Observed concern:** `server/utils/rateLimit.ts` uses a process-local in-memory `Map`. Its own comments correctly note that serverless instances do not share counters.

Requirements:

- Keep Supabase's built-in protections.
- Consider a shared rate-limit store (for example, Redis or another supported shared store) if stronger cross-instance enforcement is required.
- Fail safely if the shared store is unavailable, based on the security needs of the endpoint.
- Keep rate-limit responses and `Retry-After` behavior understandable.
- Do not add a new infrastructure dependency without documenting its cost and deployment requirements.

## 4.4 Automated tests and CI

**Observed concern:** No clear automated test suite or GitHub Actions workflow was found in the repository tree during the review. Verify this before creating new infrastructure.

Add tests for:

- Expense input validation and date validation.
- Category ownership and category reassignment.
- Monthly amount validation and calculations.
- Budget calculations and alert thresholds.
- Monthly comparison calculations.
- Search and filter combinations.
- Recurring schedule generation and idempotency.
- Export escaping and backup validation.
- Authorization and cross-user/household data isolation.

Add a basic CI workflow to run the repository's relevant checks, such as:

- Dependency installation.
- Type checking (add a reliable script if the project does not have one).
- Linting (only if configured).
- Unit/integration tests.
- Production build.

Do not introduce multiple overlapping testing tools without a reason. Choose a lightweight test setup compatible with Nuxt/Vue and document how to run it.

## 4.5 Update `design.md`

**Observed concern:** The current `design.md` describes a more complex app than the implemented product and includes chart-based dashboard/report designs, income, budgets, and navigation elements that may not match the current direction.

Requirements:

- Rewrite/update it to reflect the actual product and approved roadmap.
- Keep the design simple and chart-free.
- Document only current components and pages as implemented; put future features in a clearly labeled roadmap section.
- Keep Arabic/English, RTL/LTR, light/dark, mobile-first behavior, motion, and reduced-motion requirements.
- Ensure typography, colors, spacing, components, and navigation match the actual UI rather than stale mockup assumptions.

## 4.6 README documentation

**Observed concern:** The current `README.md` still resembles the default Nuxt starter documentation.

Update it with:

- Product overview and core features.
- Screenshots only if current screenshots are available.
- Tech stack.
- Prerequisites and local setup.
- Required environment variables (names only; never include secrets).
- Supabase setup and migration instructions.
- Database type generation command.
- Development, test, type-check, and production build commands.
- Deployment notes.
- A clear note that the Supabase secret key is server-only.

Do not invent deployment details or secrets.

---

# 5. Suggested implementation order

Use this order unless repository inspection reveals a dependency that requires a change.

| Order | Feature | Priority | Relative complexity |
|---|---|---|---|
| 1 | Fix monthly comparison calculations | High | Low–medium |
| 2 | Review/remove hard-coded historical date restriction | High | Low |
| 3 | Expense search | High | Low–medium |
| 4 | Quick Add | High | Low |
| 5 | Duplicate expense | High | Low |
| 6 | CSV export | High | Low–medium |
| 7 | JSON backup and restore | High | Medium–high |
| 8 | Automated tests and CI baseline | High | Medium |
| 9 | Budget alerts | High | Medium |
| 10 | Merchant field | Medium | Medium |
| 11 | Payment method | Medium | Low–medium |
| 12 | Expense templates/favorites | Medium | Medium |
| 13 | Recurring expenses | High | High |
| 14 | Due-date reminders | Medium | Medium–high |
| 15 | Receipt attachments | Medium | Medium–high |
| 16 | Income tracking | Optional | Medium |
| 17 | Monthly budget rollover | Optional | Medium–high |
| 18 | Simple monthly textual summary | Optional | Low–medium |
| 19 | Spending-free days | Low | Low |
| 20 | Shared household | Strategic / major | Very high |
| 21 | Expense splitting | Depends on shared household | High |
| 22 | PWA installability and offline sync | Later | Very high |

### Recommended release boundaries

- **Release 1:** Correctness fixes, search, quick add, duplicate, CSV export, backup/restore, tests/CI.
- **Release 2:** Budget alerts, merchants, payment methods, templates, recurring payments, reminders, receipts.
- **Release 3:** Income, optional rollover, and simple textual monthly summaries.
- **Release 4:** Shared households and expense splitting, after a dedicated data-model/security design.
- **Release 5:** PWA and offline synchronization after the online data model is stable.

---

# 6. Product and UX rules — keep the app simple

These rules apply to every new feature.

- Do not add charts or chart libraries.
- Do not turn the home page into a dense analytics dashboard.
- Keep the existing main monthly amount concept understandable.
- Keep category budgets optional.
- Prefer a small inline control, sheet, or dialog over a new page when that is sufficient.
- Keep expense entry fast; optional fields should not overwhelm the default form.
- Show only the information a user needs for the current task.
- Use plain language and short labels.
- Support Arabic and English from the beginning of each feature, not as a final translation pass.
- Respect RTL direction and use logical CSS properties.
- Preserve dark/light themes and the existing animation language.
- Respect `prefers-reduced-motion`.
- Avoid adding dependencies when native browser functionality or existing project utilities are sufficient.
- Do not introduce AI features, bank connections, automatic payments, or financial advice unless separately requested.

---

# 7. Security, data integrity, and migration requirements

Because this application stores personal financial records, these requirements are mandatory.

1. Authenticate every protected API request on the server.
2. Derive the current user/household from the verified session and server-side membership checks; never trust owner IDs supplied by the client.
3. Scope every database query by the correct owner or authorized household.
4. Keep the Supabase service-role/secret key on the server only.
5. Validate amounts, dates, IDs, categories, filenames, file sizes, and enum values on the server.
6. Add appropriate database constraints, foreign keys, uniqueness constraints, and indexes.
7. Use transactions or database functions for multi-step operations that must not partially succeed.
8. Use idempotency protection for recurring occurrences, offline sync, imports, and retryable write operations.
9. Do not silently delete historical data when categories, templates, recurring rules, or household members are removed.
10. Define retention and deletion behavior for receipts and backups.
11. Avoid logging passwords, tokens, private receipt URLs, or full financial records.
12. Test that one user cannot read, export, edit, or delete another user's records.
13. For shared households, test every role and membership state, including revoked and expired invitations.

---

# 8. Final instructions to Claude Code

Start by producing a short implementation assessment:

1. Which requested features already exist fully or partially?
2. Which files and database tables need changes for Phase 1?
3. Which bugs or risks should be fixed before new functionality?
4. What migrations and tests will be required?
5. Are there any blockers or product decisions that cannot safely be inferred?

Then implement **Release 1 / Phase 1 only** unless explicitly instructed to continue further. Do not attempt to implement every large roadmap item in one uncontrolled change.

For each completed phase, report:

- Features implemented.
- Files/components/stores/API routes changed.
- Database migrations added.
- Tests added and their actual results.
- Type-check/build results.
- Any limitations or remaining work.

Keep the application visually consistent, simple, chart-free, responsive, bilingual, and secure.
