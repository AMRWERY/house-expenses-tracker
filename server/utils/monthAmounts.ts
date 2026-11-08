import type { Tables } from "~/types/database.types";

/** The main amount a person set for one month. `m` is 0-based (like Date and the expenses table). */
export interface MonthAmountRecord {
  y: number;
  m: number;
  amount: number;
}

const bad = (message: string) => createError({ statusCode: 400, message });
const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

/** Validate a request body; never trust the client's shape. (The database re-checks the same rules.) */
export function parseMonthAmountInput(body: unknown): MonthAmountRecord {
  const b = (body ?? {}) as Record<string, unknown>;
  if (!isInt(b.y, 2000, 2100) || !isInt(b.m, 0, 11)) throw bad("invalid_date");
  if (typeof b.amount !== "number" || !Number.isFinite(b.amount) || b.amount <= 0 || b.amount > 1e9)
    throw bad("invalid_amount");
  return { y: b.y, m: b.m, amount: Math.round(b.amount * 100) / 100 };
}

const toRecord = (r: Tables<"month_amounts">): MonthAmountRecord => ({
  y: r.y,
  m: r.m,
  amount: Number(r.amount), // numeric(12,2): be safe if it ever arrives as a string
});

// ---- Supabase access. Every query is scoped by user_id: the secret key bypasses RLS, so this is the guard. ----

export async function listMonthAmounts(userId: string) {
  const rows = must(
    await useSupabase().from("month_amounts").select("*").eq("user_id", userId).order("y").order("m"),
  );
  return (rows ?? []).map(toRecord);
}

/** Create or replace the amount for that month. */
export async function setMonthAmount(userId: string, input: MonthAmountRecord) {
  const row = must(
    await useSupabase()
      .from("month_amounts")
      .upsert(
        { user_id: userId, ...input, updated_at: new Date().toISOString() },
        { onConflict: "user_id,y,m" },
      )
      .select()
      .single(),
  );
  return toRecord(row!);
}
