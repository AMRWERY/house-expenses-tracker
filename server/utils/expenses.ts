import type { Tables } from "~/types/database.types";
import type { ExpenseRecord } from "~/types/utils";
import { MAX_YEAR, MIN_YEAR } from "#shared/utils/limits";
import { isPaymentMethod } from "#shared/utils/payment";
import { splitEqual } from "#shared/utils/split";

/** What a client may send: the receipt is managed by its own routes. */
export type ExpenseInput = Omit<ExpenseRecord, "id" | "hasReceipt" | "createdBy" | "paidBy" | "split"> & {
  /** shared households: a member id (default: the person adding it) */
  paidBy?: string;
  /** shared households: members who share the cost equally; [] removes the split, undefined leaves it as it is */
  splitWith?: string[];
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const bad = (message: string) => createError({ statusCode: 400, message });
const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

/** Validate a request body; never trust the client's shape. (The database re-checks the same rules.) */
export const parseExpenseInput = (body: unknown): ExpenseInput => {
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
  if (!isInt(b.y, MIN_YEAR, MAX_YEAR) || !isInt(b.m, 0, 11) || !isInt(b.day, 1, 31))
    throw bad("invalid_date");
  const d = new Date(b.y, b.m, b.day);
  if (d.getMonth() !== b.m || d.getDate() !== b.day) throw bad("invalid_date"); // e.g. 31 Feb

  let note: string | undefined;
  if (b.note !== undefined && b.note !== null) {
    if (typeof b.note !== "string" || b.note.length > 80)
      throw bad("invalid_note");
    note = b.note.trim() || undefined;
  }

  let merchant: string | undefined;
  if (b.merchant !== undefined && b.merchant !== null) {
    if (typeof b.merchant !== "string" || b.merchant.length > 60) throw bad("invalid_merchant");
    merchant = b.merchant.trim() || undefined;
  }

  let paymentMethod: ExpenseInput["paymentMethod"];
  if (b.paymentMethod !== undefined && b.paymentMethod !== null) {
    if (!isPaymentMethod(b.paymentMethod)) throw bad("invalid_payment_method");
    paymentMethod = b.paymentMethod;
  }

  let paidBy: string | undefined;
  if (b.paidBy !== undefined && b.paidBy !== null) {
    if (typeof b.paidBy !== "string" || !UUID_RE.test(b.paidBy)) throw bad("invalid_member");
    paidBy = b.paidBy;
  }
  let splitWith: string[] | undefined;
  if (b.splitWith !== undefined && b.splitWith !== null) {
    if (!Array.isArray(b.splitWith) || b.splitWith.length > 10) throw bad("invalid_member");
    const ids = b.splitWith.map((v) => (typeof v === "string" && UUID_RE.test(v) ? v : null));
    if (ids.includes(null) || new Set(ids).size !== ids.length) throw bad("invalid_member");
    splitWith = ids as string[];
  }

  return {
    cat: b.cat,
    amount: Math.round(b.amount * 100) / 100,
    y: b.y,
    m: b.m,
    day: b.day,
    note,
    merchant,
    paymentMethod,
    paidBy,
    splitWith,
  };
};

export const parseId = (raw: string | undefined) => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) throw bad("invalid_id");
  return id;
};

// ---- Supabase access. Every query is scoped by household_id: the secret key bypasses RLS, so this is the guard. ----

type SplitRow = Tables<"expense_splits">;

const toRecord = (r: Tables<"expenses">, splits: SplitRow[] = []): ExpenseRecord => ({
  id: Number(r.id),
  cat: r.cat,
  amount: Number(r.amount), // numeric(12,2): be safe if it ever arrives as a string
  y: r.y,
  m: r.m,
  day: r.day,
  ...(r.note ? { note: r.note } : {}),
  ...(r.merchant ? { merchant: r.merchant } : {}),
  ...(isPaymentMethod(r.payment_method) ? { paymentMethod: r.payment_method } : {}),
  ...(r.receipt_path ? { hasReceipt: true } : {}),
  ...(r.created_by ? { createdBy: r.created_by } : {}),
  ...(r.paid_by ? { paidBy: r.paid_by } : {}),
  ...(splits.length
    ? { split: splits.map((s) => ({ userId: s.user_id, share: Number(s.share), settled: s.settled_at !== null })) }
    : {}),
});

/** The columns an input writes (merchant and payment method are cleared when left out). */
export const expenseColumns = (i: ExpenseInput) => ({
  cat: i.cat,
  amount: i.amount,
  y: i.y,
  m: i.m,
  day: i.day,
  note: i.note ?? null,
  merchant: i.merchant ?? null,
  payment_method: i.paymentMethod ?? null,
});

export const listExpenses = async (scope: Scope) => {
  const db = useSupabase();
  const [rows, splits] = await Promise.all([
    db.from("expenses").select("*").eq("household_id", scope.householdId).order("y").order("m").order("day").order("id"),
    db.from("expense_splits").select("*").eq("household_id", scope.householdId),
  ]);
  const byExpense = new Map<number, SplitRow[]>();
  for (const s of must(splits) ?? []) byExpense.set(Number(s.expense_id), [...(byExpense.get(Number(s.expense_id)) ?? []), s]);
  return (must(rows) ?? []).map((r) => toRecord(r, byExpense.get(Number(r.id))));
};

/** paidBy and splitWith may only name CURRENT members of this household. */
const assertMembers = async (scope: Scope, input: ExpenseInput) => {
  const named = [...(input.paidBy ? [input.paidBy] : []), ...(input.splitWith ?? [])];
  if (!named.length) return;
  const members = await memberIds(scope.householdId);
  if (named.some((id) => !members.has(id))) throw createError({ statusCode: 400, message: "invalid_member" });
};

/** Write an equal split: the payer's own share is settled from the start. Shares add up to the amount exactly. */
const writeSplits = async (scope: Scope, expenseId: number, amount: number, payer: string, participants: string[]) => {
  const db = useSupabase();
  must(await db.from("expense_splits").delete().eq("expense_id", expenseId).eq("household_id", scope.householdId));
  if (!participants.length) return;
  // payer first (when sharing), then the others in a stable order, so the extra cents land on the same people every time
  const order = [...participants].sort((a, b) => (a === payer ? -1 : b === payer ? 1 : a.localeCompare(b)));
  const shares = splitEqual(amount, order.length);
  const now = new Date().toISOString();
  must(
    await db.from("expense_splits").insert(
      order.map((userId, i) => ({
        expense_id: expenseId,
        household_id: scope.householdId,
        user_id: userId,
        share: shares[i]!,
        settled_at: userId === payer ? now : null,
        settled_by: userId === payer ? payer : null,
      })),
    ),
  );
};

export const createExpense = async (scope: Scope, input: ExpenseInput) => {
  await assertCategoryAllowed(scope, input.cat);
  await assertMembers(scope, input);
  const paidBy = input.paidBy ?? scope.userId;
  const row = must(
    await useSupabase()
      .from("expenses")
      .insert({
        user_id: scope.userId,
        household_id: scope.householdId,
        created_by: scope.userId,
        paid_by: paidBy,
        ...expenseColumns(input),
      })
      .select()
      .single(),
  )!;
  if (input.splitWith?.length) {
    try {
      await writeSplits(scope, Number(row.id), input.amount, paidBy, input.splitWith);
    } catch (e) {
      await useSupabase().from("expenses").delete().eq("id", row.id).eq("household_id", scope.householdId); // no half-saved expense
      throw e;
    }
  }
  return (await getExpense(scope, Number(row.id))) ?? toRecord(row);
};

const getExpense = async (scope: Scope, id: number) => {
  const db = useSupabase();
  const row = must(await db.from("expenses").select("*").eq("id", id).eq("household_id", scope.householdId).maybeSingle());
  if (!row) return null;
  const splits = must(await db.from("expense_splits").select("*").eq("expense_id", id).eq("household_id", scope.householdId)) ?? [];
  return toRecord(row, splits);
};

/** A split with someone's share already settled is locked: changing it would rewrite what people agreed. */
const isLocked = (splits: SplitRow[], payer: string | null) => splits.some((s) => s.settled_at !== null && s.user_id !== payer);

/**
 * Returns null when the expense doesn't exist in this household. Members may change their own expenses; admins and owners
 * anyone's (403 otherwise).
 */
export const updateExpense = async (scope: Scope, id: number, input: ExpenseInput) => {
  await assertCategoryAllowed(scope, input.cat);
  await assertMembers(scope, input);
  const db = useSupabase();
  const existing = must(await db.from("expenses").select("*").eq("id", id).eq("household_id", scope.householdId).maybeSingle());
  if (!existing) return null;
  if (!canChangeRecord(scope, existing.created_by)) throw createError({ statusCode: 403, message: "forbidden" });

  const splits = must(await db.from("expense_splits").select("*").eq("expense_id", id).eq("household_id", scope.householdId)) ?? [];
  const paidBy = input.paidBy ?? existing.paid_by ?? scope.userId;
  const amountChanged = Number(existing.amount) !== input.amount;
  const paidByChanged = paidBy !== existing.paid_by;
  // Re-split when asked to, or when the amount/payer changed under an existing split (same participants)
  const participants = input.splitWith ?? (splits.length && (amountChanged || paidByChanged) ? splits.map((s) => s.user_id) : undefined);
  if (participants !== undefined && splits.length && isLocked(splits, existing.paid_by)) {
    const same = participants.length === splits.length && participants.every((p) => splits.some((s) => s.user_id === p));
    if (!same || amountChanged || paidByChanged) throw createError({ statusCode: 409, message: "split_locked" });
  } else if (participants !== undefined) {
    // nothing is settled yet: safe to rewrite the split
  }

  must(
    await db
      .from("expenses")
      .update({ ...expenseColumns(input), paid_by: paidBy })
      .eq("id", id)
      .eq("household_id", scope.householdId),
  );
  if (participants !== undefined && !(splits.length && isLocked(splits, existing.paid_by))) {
    await writeSplits(scope, id, input.amount, paidBy, participants);
  }
  return getExpense(scope, id);
};

/** Returns false when the expense doesn't exist in this household; 403 when it is someone else's and you are a plain member. */
export const deleteExpense = async (scope: Scope, id: number) => {
  const db = useSupabase();
  const existing = must(await db.from("expenses").select("id, created_by").eq("id", id).eq("household_id", scope.householdId).maybeSingle());
  if (!existing) return false;
  if (!canChangeRecord(scope, existing.created_by)) throw createError({ statusCode: 403, message: "forbidden" });
  const row = must(
    await db.from("expenses").delete().eq("id", id).eq("household_id", scope.householdId).select("id, receipt_path").maybeSingle(),
  );
  if (row?.receipt_path) await deleteReceiptFile(row.receipt_path);
  return !!row;
};

/** Mark one participant's share settled or not. The payer's own share can't change. Every change is logged. */
export const setShareSettled = async (scope: Scope, expenseId: number, participantId: string, settled: boolean) => {
  if (!UUID_RE.test(participantId)) throw createError({ statusCode: 400, message: "invalid_member" });
  const db = useSupabase();
  const expense = must(await db.from("expenses").select("id, paid_by").eq("id", expenseId).eq("household_id", scope.householdId).maybeSingle());
  if (!expense) return null;
  if (participantId === expense.paid_by) throw createError({ statusCode: 409, message: "payer_share" });
  const share = must(
    await db.from("expense_splits").select("*").eq("expense_id", expenseId).eq("household_id", scope.householdId).eq("user_id", participantId).maybeSingle(),
  );
  if (!share) return null;
  if ((share.settled_at !== null) === settled) return getExpense(scope, expenseId); // already so: nothing to do, nothing to log
  must(
    await db
      .from("expense_splits")
      .update({ settled_at: settled ? new Date().toISOString() : null, settled_by: settled ? scope.userId : null })
      .eq("expense_id", expenseId)
      .eq("household_id", scope.householdId)
      .eq("user_id", participantId),
  );
  must(
    await db.from("expense_split_log").insert({
      expense_id: expenseId,
      household_id: scope.householdId,
      participant_id: participantId,
      action: settled ? "settled" : "unsettled",
      by_user: scope.userId,
    }),
  );
  return getExpense(scope, expenseId);
};
