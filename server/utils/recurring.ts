import type { Tables } from "~/types/database.types";
import { MAX_YEAR, MIN_YEAR } from "#shared/utils/limits";
import { isPaymentMethod, type PaymentMethod } from "#shared/utils/payment";
import {
  FREQUENCIES,
  addDays,
  advance,
  firstOnOrAfter,
  parseISO,
  type Frequency,
} from "#shared/utils/recurrence";

/**
 * Recurring expense rules. A rule never creates an expense on its own: its `nextDue` occurrence waits for the person to
 * confirm it (or skip it). Confirming is idempotent: (rule, scheduled date) is unique in the database, and the request
 * must name the occurrence it confirms, so a retry or a second tap can never add the same occurrence twice.
 */
export interface RecurringRecord {
  id: string;
  title: string;
  amount: number;
  cat: string;
  note?: string;
  merchant?: string;
  paymentMethod?: PaymentMethod;
  frequency: Frequency;
  interval: number;
  startDate: string;
  /** the occurrence waiting for confirmation; null once the rule has run past its end date */
  nextDue: string | null;
  endDate: string | null;
  active: boolean;
  remindDaysBefore: number;
  lastRemindedFor: string | null;
}

export interface RecurringInput {
  title: string;
  amount: number;
  cat: string;
  note?: string;
  merchant?: string;
  paymentMethod?: PaymentMethod;
  frequency: Frequency;
  interval: number;
  startDate: string;
  endDate: string | null;
  remindDaysBefore: number;
  /** the person's local date today (their time zone); used when the schedule is recomputed */
  today: string;
}

export const MAX_RECURRING = 50;
const MAX_INTERVAL: Record<Frequency, number> = { daily: 365, weekly: 52, monthly: 24, yearly: 10 };

const bad = (message: string) => createError({ statusCode: 400, message });
const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

/** A YYYY-MM-DD in the supported years. */
function parseDate(v: unknown, error = "invalid_date"): string {
  if (typeof v !== "string") throw bad(error);
  const p = parseISO(v);
  if (!p || p.y < MIN_YEAR || p.y > MAX_YEAR) throw bad(error);
  return v;
}

/**
 * The client's "today" must be a real date close to the server's (any time zone is within a day of UTC):
 * it is trusted only for choosing where a schedule resumes, never for authorization.
 */
export function parseToday(v: unknown): string {
  const today = parseDate(v);
  const server = new Date().toISOString().slice(0, 10);
  if (today < addDays(server, -2) || today > addDays(server, 2)) throw bad("invalid_date");
  return today;
}

export function parseRecurringInput(body: unknown): RecurringInput {
  const b = (body ?? {}) as Record<string, unknown>;
  if (typeof b.title !== "string" || b.title.trim().length < 1 || b.title.trim().length > 60) throw bad("invalid_name");
  if (typeof b.amount !== "number" || !Number.isFinite(b.amount) || b.amount <= 0 || b.amount > 1e9) throw bad("invalid_amount");
  if (typeof b.cat !== "string" || b.cat.length < 1 || b.cat.length > 40) throw bad("invalid_category");
  if (typeof b.frequency !== "string" || !(FREQUENCIES as readonly string[]).includes(b.frequency)) throw bad("invalid_frequency");
  const frequency = b.frequency as Frequency;
  if (!isInt(b.interval, 1, MAX_INTERVAL[frequency])) throw bad("invalid_interval");
  const startDate = parseDate(b.startDate);
  const endDate = b.endDate === undefined || b.endDate === null ? null : parseDate(b.endDate);
  if (endDate !== null && endDate < startDate) throw bad("invalid_date");
  if (!isInt(b.remindDaysBefore, 0, 30)) throw bad("invalid_reminder");

  const optional = (v: unknown, max: number, error: string) => {
    if (v === undefined || v === null) return undefined;
    if (typeof v !== "string" || v.length > max) throw bad(error);
    return v.trim() || undefined;
  };
  let paymentMethod: PaymentMethod | undefined;
  if (b.paymentMethod !== undefined && b.paymentMethod !== null) {
    if (!isPaymentMethod(b.paymentMethod)) throw bad("invalid_payment_method");
    paymentMethod = b.paymentMethod;
  }
  return {
    title: b.title.trim(),
    amount: Math.round(b.amount * 100) / 100,
    cat: b.cat,
    note: optional(b.note, 80, "invalid_note"),
    merchant: optional(b.merchant, 60, "invalid_merchant"),
    paymentMethod,
    frequency,
    interval: b.interval,
    startDate,
    endDate,
    remindDaysBefore: b.remindDaysBefore,
    today: parseToday(b.today),
  };
}

/** Body of confirm/skip: which occurrence, and (confirm only) an amount different from the rule's. */
export function parseOccurrenceAction(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>;
  const date = parseDate(b.date);
  let amount: number | undefined;
  if (b.amount !== undefined && b.amount !== null) {
    if (typeof b.amount !== "number" || !Number.isFinite(b.amount) || b.amount <= 0 || b.amount > 1e9) throw bad("invalid_amount");
    amount = Math.round(b.amount * 100) / 100;
  }
  return { date, amount };
}

// ---- Supabase access. Every query is scoped by user_id: the secret key bypasses RLS, so this is the guard. ----

const toRecord = (r: Tables<"recurring_expenses">): RecurringRecord => ({
  id: r.id,
  title: r.title,
  amount: Number(r.amount),
  cat: r.cat,
  ...(r.note ? { note: r.note } : {}),
  ...(r.merchant ? { merchant: r.merchant } : {}),
  ...(isPaymentMethod(r.payment_method) ? { paymentMethod: r.payment_method } : {}),
  frequency: r.frequency as Frequency,
  interval: r.interval_count,
  startDate: r.start_date,
  nextDue: r.next_due,
  endDate: r.end_date,
  active: r.active,
  remindDaysBefore: r.remind_days_before,
  lastRemindedFor: r.last_reminded_for,
});

async function getRule(scope: Scope, id: string) {
  const row = must(await useSupabase().from("recurring_expenses").select("*").eq("id", id).eq("household_id", scope.householdId).maybeSingle());
  return row ?? null;
}

export async function listRecurring(scope: Scope) {
  const rows = must(await useSupabase().from("recurring_expenses").select("*").eq("household_id", scope.householdId).order("created_at").order("id"));
  return (rows ?? []).map(toRecord);
}

const columns = (i: RecurringInput) => ({
  title: i.title,
  amount: i.amount,
  cat: i.cat,
  note: i.note ?? null,
  merchant: i.merchant ?? null,
  payment_method: i.paymentMethod ?? null,
  frequency: i.frequency,
  interval_count: i.interval,
  start_date: i.startDate,
  end_date: i.endDate,
  remind_days_before: i.remindDaysBefore,
});

export async function createRecurring(scope: Scope, input: RecurringInput) {
  await assertCategoryAllowed(scope, input.cat);
  const db = useSupabase();
  const { count, error } = await db.from("recurring_expenses").select("id", { count: "exact", head: true }).eq("household_id", scope.householdId);
  if (error) {
    console.error("[supabase]", error.code, error.message);
    throw createError({ statusCode: 500, message: "database_error" });
  }
  if ((count ?? 0) >= MAX_RECURRING) throw createError({ statusCode: 409, message: "recurring_limit" });
  // The first occurrence is the start date itself (in the past = it is overdue until confirmed or skipped).
  const row = must(
    await db.from("recurring_expenses").insert({ user_id: scope.userId, household_id: scope.householdId, ...columns(input), next_due: input.startDate }).select().single(),
  );
  return toRecord(row!);
}

/** Returns null when the rule doesn't exist or belongs to someone else. Expenses already recorded are never touched. */
export async function updateRecurring(scope: Scope, id: string, input: RecurringInput) {
  await assertCategoryAllowed(scope, input.cat);
  const current = await getRule(scope, id);
  if (!current) return null;

  const scheduleChanged =
    current.frequency !== input.frequency ||
    current.interval_count !== input.interval ||
    current.start_date !== input.startDate ||
    current.end_date !== input.endDate;
  // A changed schedule resumes at its first occurrence from today on (or from the start date, if that is later).
  let nextDue = current.next_due;
  if (scheduleChanged) {
    const from = input.today > input.startDate ? input.today : input.startDate;
    nextDue = firstOnOrAfter(input.startDate, input.frequency, input.interval, from, input.endDate);
  }
  const row = must(
    await useSupabase()
      .from("recurring_expenses")
      .update({ ...columns(input), next_due: nextDue, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("household_id", scope.householdId)
      .select()
      .maybeSingle(),
  );
  return row ? toRecord(row) : null;
}

/** Pause keeps the rule and its history. Resuming skips whatever fell due while it was paused. */
export async function setRecurringActive(scope: Scope, id: string, active: boolean, today: string) {
  const current = await getRule(scope, id);
  if (!current) return null;
  let nextDue = current.next_due;
  if (active && !current.active && nextDue !== null && nextDue < today) {
    nextDue = firstOnOrAfter(
      current.start_date,
      current.frequency as Frequency,
      current.interval_count,
      today,
      current.end_date,
    );
  }
  const row = must(
    await useSupabase()
      .from("recurring_expenses")
      .update({ active, next_due: nextDue, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("household_id", scope.householdId)
      .select()
      .maybeSingle(),
  );
  return row ? toRecord(row) : null;
}

export async function deleteRecurring(scope: Scope, id: string) {
  const row = must(await useSupabase().from("recurring_expenses").delete().eq("id", id).eq("household_id", scope.householdId).select("id").maybeSingle());
  return !!row;
}

/** Remember that the reminder for this occurrence was shown, so it is shown once. */
export async function markReminded(scope: Scope, id: string, date: string) {
  const row = must(
    await useSupabase()
      .from("recurring_expenses")
      .update({ last_reminded_for: date })
      .eq("id", id)
      .eq("household_id", scope.householdId)
      .eq("next_due", date)
      .select()
      .maybeSingle(),
  );
  return row ? toRecord(row) : null;
}

/** Move the rule on to its next occurrence after `date` was handled. */
async function advanceRule(scope: Scope, rule: Tables<"recurring_expenses">, date: string) {
  const next = advance(date, rule.start_date, rule.frequency as Frequency, rule.interval_count, rule.end_date);
  const row = must(
    await useSupabase()
      .from("recurring_expenses")
      .update({ next_due: next, updated_at: new Date().toISOString() })
      .eq("id", rule.id)
      .eq("household_id", scope.householdId)
      .eq("next_due", date) // only if nobody moved it already
      .select()
      .maybeSingle(),
  );
  return row ? toRecord(row) : toRecord((await getRule(scope, rule.id)) ?? rule);
}

/**
 * Handle one occurrence: confirm (adds the expense) or skip (adds nothing). The occurrence row is written FIRST: its unique
 * key is the guard against duplicates. If adding the expense then fails, the claim is released so the person can try again.
 */
export async function handleOccurrence(
  scope: Scope,
  id: string,
  action: { date: string; amount?: number },
  status: "confirmed" | "skipped",
) {
  const rule = await getRule(scope, id);
  if (!rule) return null;
  if (!rule.active) throw createError({ statusCode: 409, message: "recurring_paused" });
  if (rule.next_due !== action.date) throw createError({ statusCode: 409, message: "already_handled" });

  const db = useSupabase();
  const claim = await db
    .from("recurring_occurrences")
    .insert({ user_id: scope.userId, household_id: scope.householdId, rule_id: rule.id, scheduled_date: action.date, status })
    .select("id")
    .single();
  if (claim.error) {
    if (claim.error.code === "23505") {
      // Handled before, but the rule never moved on (a crash between the two steps): repair, then report it.
      await advanceRule(scope, rule, action.date);
      throw createError({ statusCode: 409, message: "already_handled" });
    }
    console.error("[supabase]", claim.error.code, claim.error.message);
    throw createError({ statusCode: 500, message: "database_error" });
  }

  let expense: Awaited<ReturnType<typeof createExpense>> | null = null;
  if (status === "confirmed") {
    const p = parseISO(action.date)!;
    try {
      expense = await createExpense(scope, {
        cat: rule.cat,
        amount: action.amount ?? Number(rule.amount),
        y: p.y,
        m: p.m - 1,
        day: p.d,
        note: rule.note ?? rule.title,
        merchant: rule.merchant ?? undefined,
        paymentMethod: isPaymentMethod(rule.payment_method) ? rule.payment_method : undefined,
      });
    } catch (e) {
      await db.from("recurring_occurrences").delete().eq("id", claim.data.id).eq("household_id", scope.householdId); // release the claim
      throw e;
    }
    must(await db.from("recurring_occurrences").update({ expense_id: expense.id }).eq("id", claim.data.id).eq("household_id", scope.householdId));
  }
  const updated = await advanceRule(scope, rule, action.date);
  return { rule: updated, expense };
}
