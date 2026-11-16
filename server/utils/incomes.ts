import type { Tables } from "~/types/database.types";
import { isIncomeSource, type IncomeSource } from "#shared/utils/income";
import { MAX_YEAR, MIN_YEAR } from "#shared/utils/limits";

/** Money coming in. Kept apart from expenses: it never counts against a category budget. */
export interface IncomeRecord {
  id: number;
  amount: number;
  y: number;
  m: number;
  day: number;
  source: IncomeSource;
  note?: string;
}
export type IncomeInput = Omit<IncomeRecord, "id">;

const bad = (message: string) => createError({ statusCode: 400, message });
const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

/** Validate a request body; never trust the client's shape. (The database re-checks the same rules.) */
export const parseIncomeInput = (body: unknown): IncomeInput => {
  const b = (body ?? {}) as Record<string, unknown>;
  if (typeof b.amount !== "number" || !Number.isFinite(b.amount) || b.amount <= 0 || b.amount > 1e9) throw bad("invalid_amount");
  if (!isInt(b.y, MIN_YEAR, MAX_YEAR) || !isInt(b.m, 0, 11) || !isInt(b.day, 1, 31)) throw bad("invalid_date");
  const d = new Date(b.y, b.m, b.day);
  if (d.getMonth() !== b.m || d.getDate() !== b.day) throw bad("invalid_date"); // e.g. 31 Feb
  if (!isIncomeSource(b.source)) throw bad("invalid_source");
  let note: string | undefined;
  if (b.note !== undefined && b.note !== null) {
    if (typeof b.note !== "string" || b.note.length > 80) throw bad("invalid_note");
    note = b.note.trim() || undefined;
  }
  return { amount: Math.round(b.amount * 100) / 100, y: b.y, m: b.m, day: b.day, source: b.source, note };
};

// ---- Supabase access. Every query is scoped by user_id: the secret key bypasses RLS, so this is the guard. ----

const toRecord = (r: Tables<"incomes">): IncomeRecord => ({
  id: Number(r.id),
  amount: Number(r.amount),
  y: r.y,
  m: r.m,
  day: r.day,
  source: isIncomeSource(r.source) ? r.source : "other",
  ...(r.note ? { note: r.note } : {}),
});

const toColumns = (i: IncomeInput) => ({ amount: i.amount, y: i.y, m: i.m, day: i.day, source: i.source, note: i.note ?? null });

/** Members may change their own income records; admins and owners anyone's. A missing record passes (the caller answers 404). */
const assertOwnIncome = async (scope: Scope, id: number) => {
  const row = must(await useSupabase().from("incomes").select("created_by").eq("id", id).eq("household_id", scope.householdId).maybeSingle());
  if (row && !canChangeRecord(scope, row.created_by)) throw createError({ statusCode: 403, message: "forbidden" });
};

export const listIncomes = async (scope: Scope) => {
  const rows = must(
    await useSupabase().from("incomes").select("*").eq("household_id", scope.householdId).order("y").order("m").order("day").order("id"),
  );
  return (rows ?? []).map(toRecord);
};

export const createIncome = async (scope: Scope, input: IncomeInput) => {
  const row = must(await useSupabase().from("incomes").insert({ user_id: scope.userId, household_id: scope.householdId, created_by: scope.userId, ...toColumns(input) }).select().single());
  return toRecord(row!);
};

/** Returns null when the income doesn't exist or belongs to someone else. */
export const updateIncome = async (scope: Scope, id: number, input: IncomeInput) => {
  await assertOwnIncome(scope, id);
  const row = must(
    await useSupabase().from("incomes").update(toColumns(input)).eq("id", id).eq("household_id", scope.householdId).select().maybeSingle(),
  );
  return row ? toRecord(row) : null;
};

export const deleteIncome = async (scope: Scope, id: number) => {
  await assertOwnIncome(scope, id);
  const row = must(await useSupabase().from("incomes").delete().eq("id", id).eq("household_id", scope.householdId).select("id").maybeSingle());
  return !!row;
};
