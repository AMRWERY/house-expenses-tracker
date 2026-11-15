import type { ExpenseInput } from "./expenses";
import type { IncomeInput } from "./incomes";
import type { MonthAmountRecord } from "./monthAmounts";

/**
 * JSON backup of one person's data, and merge-style restore.
 * Restore only ADDS: it never deletes anything, and running it twice adds nothing the second time
 * (an expense already there with the same category, amount, date and note is skipped). Every query is scoped to the user.
 */
export const BACKUP_VERSION = 1;
const MAX_EXPENSES = 20000;
const MAX_MONTH_AMOUNTS = 1200;
const MAX_INCOMES = 20000;
const INSERT_CHUNK = 500;

export interface BackupCategory {
  /** what expenses in this file call the category: a default's key, or the old id of a custom category */
  ref: string;
  key: string | null;
  name: string | null;
  color: string;
  icon: string;
  budget: number | null;
}

export interface BackupFile {
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  categories: BackupCategory[];
  expenses: ExpenseInput[];
  monthAmounts: MonthAmountRecord[];
  /** older backups (before income tracking) have none */
  incomes: IncomeInput[];
}

const bad = () => createError({ statusCode: 400, message: "invalid_backup" });

/** Validate an uploaded backup; never trust its shape. Throws 400 invalid_backup. */
export function parseBackup(body: unknown): BackupFile {
  const b = (body ?? {}) as Record<string, unknown>;
  if (b.version !== BACKUP_VERSION) throw bad();
  const { categories, expenses, monthAmounts } = b;
  const incomes = b.incomes ?? [];
  if (!Array.isArray(categories) || categories.length > MAX_CATEGORIES) throw bad();
  if (!Array.isArray(expenses) || expenses.length > MAX_EXPENSES) throw bad();
  if (!Array.isArray(monthAmounts) || monthAmounts.length > MAX_MONTH_AMOUNTS) throw bad();
  if (!Array.isArray(incomes) || incomes.length > MAX_INCOMES) throw bad();

  try {
    const seen = new Set<string>();
    const cats = categories.map((raw): BackupCategory => {
      const c = (raw ?? {}) as Record<string, unknown>;
      if (typeof c.ref !== "string" || c.ref.length < 1 || c.ref.length > 40 || seen.has(c.ref)) throw bad();
      seen.add(c.ref);
      const key = c.key ?? null;
      if (key !== null && !(typeof key === "string" && DEFAULT_CATEGORY_KEYS.includes(key))) throw bad();
      const input = parseCategoryInput(c);
      if (key === null && input.name === null) throw bad(); // custom categories need a name
      return { ref: c.ref, key, ...input };
    });
    return {
      version: BACKUP_VERSION,
      exportedAt: typeof b.exportedAt === "string" ? b.exportedAt.slice(0, 40) : "",
      categories: cats,
      expenses: expenses.map((e) => parseExpenseInput(e)),
      monthAmounts: monthAmounts.map((a) => parseMonthAmountInput(a)),
      incomes: incomes.map((i) => parseIncomeInput(i)),
    };
  } catch {
    throw bad(); // whatever field was wrong, the file is not a valid backup
  }
}

export async function buildBackup(scope: Scope): Promise<BackupFile> {
  const [categories, expenses, monthAmounts, incomes] = await Promise.all([
    listCategories(scope),
    listExpenses(scope),
    listMonthAmounts(scope),
    listIncomes(scope),
  ]);
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    categories: categories.map((c) => ({
      ref: c.key ?? c.id,
      key: c.key,
      name: c.name,
      color: c.color,
      icon: c.icon,
      budget: c.budget,
    })),
    expenses: expenses.map(({ id: _id, hasReceipt: _receipt, ...rest }) => rest), // receipts are not part of a backup
    monthAmounts,
    incomes: incomes.map(({ id: _id, ...rest }) => rest),
  };
}

const signature = (e: ExpenseInput) =>
  `${e.cat}|${e.amount}|${e.y}|${e.m}|${e.day}|${e.note ?? ""}|${e.merchant ?? ""}|${e.paymentMethod ?? ""}`;

export async function restoreBackup(scope: Scope, file: BackupFile) {
  const db = useSupabase();
  const existing = await listCategories(scope); // also creates the defaults for a brand-new account

  // 1. Categories: defaults are matched by key, custom ones by name; a missing one is created.
  const refMap = new Map<string, string>(); // the file's ref -> what an expense stores here
  for (const c of file.categories) {
    const settings = { name: c.name, color: c.color, icon: c.icon, budget: c.budget };
    if (c.key) {
      const mine = existing.find((x) => x.key === c.key);
      if (mine) await updateCategory(scope, mine.id, settings);
      else must(await db.from("categories").insert({ user_id: scope.userId, household_id: scope.householdId, key: c.key, ...settings }));
      refMap.set(c.ref, c.key);
    } else {
      const sameName = existing.find((x) => x.key === null && x.name?.toLowerCase() === c.name?.toLowerCase());
      const record = sameName ?? (await createCategory(scope, settings));
      if (!sameName) existing.push(record);
      refMap.set(c.ref, record.id);
    }
  }
  const allowed = new Set((await listCategories(scope)).map((c) => c.key ?? c.id));
  const fallback = allowed.has("other") ? "other" : [...allowed][0];
  if (!fallback && file.expenses.length) throw createError({ statusCode: 409, message: "no_categories" });

  // 2. Month amounts: the file's value wins for the months it lists.
  if (file.monthAmounts.length) {
    must(
      await db.from("month_amounts").upsert(
        file.monthAmounts.map((a) => ({ user_id: scope.userId, household_id: scope.householdId, ...a, updated_at: new Date().toISOString() })),
        { onConflict: "household_id,y,m" },
      ),
    );
  }

  // 3. Expenses: skip what is already there (so a repeated restore adds nothing), insert the rest.
  const have = new Map<string, number>();
  for (const e of await listExpenses(scope)) have.set(signature(e), (have.get(signature(e)) ?? 0) + 1);
  const rows: (ReturnType<typeof expenseColumns> & { user_id: string; household_id: string; created_by: string; paid_by: string })[] = [];
  let skipped = 0;
  for (const e of file.expenses) {
    const mapped = refMap.get(e.cat) ?? e.cat;
    const cat = allowed.has(mapped) ? mapped : fallback!;
    const item = { ...e, cat };
    const left = have.get(signature(item)) ?? 0;
    if (left > 0) {
      have.set(signature(item), left - 1);
      skipped++;
    } else {
      rows.push({ user_id: scope.userId, household_id: scope.householdId, created_by: scope.userId, paid_by: scope.userId, ...expenseColumns(item) });
    }
  }
  for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
    must(await db.from("expenses").insert(rows.slice(i, i + INSERT_CHUNK)));
  }
  // 4. Income, the same way: what is already there is skipped.
  const haveIncome = new Map<string, number>();
  const incomeSig = (i: IncomeInput) => `${i.source}|${i.amount}|${i.y}|${i.m}|${i.day}|${i.note ?? ""}`;
  for (const i of await listIncomes(scope)) haveIncome.set(incomeSig(i), (haveIncome.get(incomeSig(i)) ?? 0) + 1);
  const incomeRows: { user_id: string; household_id: string; created_by: string; amount: number; y: number; m: number; day: number; source: string; note: string | null }[] = [];
  for (const i of file.incomes) {
    const left = haveIncome.get(incomeSig(i)) ?? 0;
    if (left > 0) {
      haveIncome.set(incomeSig(i), left - 1);
      skipped++;
    } else {
      incomeRows.push({ user_id: scope.userId, household_id: scope.householdId, created_by: scope.userId, amount: i.amount, y: i.y, m: i.m, day: i.day, source: i.source, note: i.note ?? null });
    }
  }
  for (let i = 0; i < incomeRows.length; i += INSERT_CHUNK) {
    must(await db.from("incomes").insert(incomeRows.slice(i, i + INSERT_CHUNK)));
  }
  return {
    added: rows.length + incomeRows.length,
    skipped,
    monthAmounts: file.monthAmounts.length,
    categories: file.categories.length,
  };
}
