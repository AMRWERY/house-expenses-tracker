import type { Tables } from "~/types/database.types";
import type { ExpenseRecord } from "~/types/utils";

export type ExpenseInput = Omit<ExpenseRecord, "id">;

const bad = (message: string) => createError({ statusCode: 400, message });
const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

/** Validate a request body; never trust the client's shape. (The database re-checks the same rules.) */
export function parseExpenseInput(body: unknown): ExpenseInput {
  const b = (body ?? {}) as Record<string, unknown>;

  // Shape only: whether it is a built-in key or one of THIS user's categories is checked in
  // assertCategoryAllowed() when the expense is saved.
  if (typeof b.cat !== "string" || b.cat.length < 1 || b.cat.length > 40)
    throw bad("invalid_category");
  if (
    typeof b.amount !== "number" ||
    !Number.isFinite(b.amount) ||
    b.amount <= 0 ||
    b.amount > 1e9
  )
    throw bad("invalid_amount");
  if (!isInt(b.y, 2000, 2100) || !isInt(b.m, 0, 11) || !isInt(b.day, 1, 31))
    throw bad("invalid_date");
  const d = new Date(b.y, b.m, b.day);
  if (d.getMonth() !== b.m || d.getDate() !== b.day) throw bad("invalid_date"); // e.g. 31 Feb

  let note: string | undefined;
  if (b.note !== undefined && b.note !== null) {
    if (typeof b.note !== "string" || b.note.length > 80)
      throw bad("invalid_note");
    note = b.note.trim() || undefined;
  }

  return {
    cat: b.cat,
    amount: Math.round(b.amount * 100) / 100,
    y: b.y,
    m: b.m,
    day: b.day,
    note,
  };
}

export function parseId(raw: string | undefined) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) throw bad("invalid_id");
  return id;
}

// ---- Supabase access. Every query is scoped by user_id: the secret key bypasses RLS, so this is the guard. ----

const toRecord = (r: Tables<"expenses">): ExpenseRecord => ({
  id: Number(r.id),
  cat: r.cat,
  amount: Number(r.amount), // numeric(12,2): be safe if it ever arrives as a string
  y: r.y,
  m: r.m,
  day: r.day,
  ...(r.note ? { note: r.note } : {}),
});

export async function listExpenses(userId: string) {
  const rows = must(
    await useSupabase()
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .order("y")
      .order("m")
      .order("day")
      .order("id"),
  );
  return (rows ?? []).map(toRecord);
}

export async function createExpense(userId: string, input: ExpenseInput) {
  await assertCategoryAllowed(userId, input.cat);
  const row = must(
    await useSupabase()
      .from("expenses")
      .insert({ user_id: userId, ...input, note: input.note ?? null })
      .select()
      .single(),
  );
  return toRecord(row!);
}

/** Returns null when the expense doesn't exist or belongs to someone else. */
export async function updateExpense(
  userId: string,
  id: number,
  input: ExpenseInput,
) {
  await assertCategoryAllowed(userId, input.cat);
  const row = must(
    await useSupabase()
      .from("expenses")
      .update({ ...input, note: input.note ?? null })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .maybeSingle(),
  );
  return row ? toRecord(row) : null;
}

/** Returns false when the expense doesn't exist or belongs to someone else. */
export async function deleteExpense(userId: string, id: number) {
  const row = must(
    await useSupabase()
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle(),
  );
  return !!row;
}
