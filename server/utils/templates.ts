import type { Tables } from "~/types/database.types";
import { isPaymentMethod, type PaymentMethod } from "#shared/utils/payment";

/** A reusable starting point for an expense. It never creates an expense by itself. */
export interface TemplateRecord {
  id: string;
  name: string;
  /** suggested amount; null = ask each time */
  amount: number | null;
  cat: string;
  note?: string;
  merchant?: string;
  paymentMethod?: PaymentMethod;
}
export type TemplateInput = Omit<TemplateRecord, "id">;
export const MAX_TEMPLATES = 50;

const bad = (message: string) => createError({ statusCode: 400, message });

export function parseTemplateInput(body: unknown): TemplateInput {
  const b = (body ?? {}) as Record<string, unknown>;
  if (typeof b.name !== "string" || b.name.trim().length < 1 || b.name.trim().length > 40) throw bad("invalid_name");
  if (typeof b.cat !== "string" || b.cat.length < 1 || b.cat.length > 40) throw bad("invalid_category");

  let amount: number | null = null;
  if (b.amount !== undefined && b.amount !== null) {
    if (typeof b.amount !== "number" || !Number.isFinite(b.amount) || b.amount <= 0 || b.amount > 1e9) throw bad("invalid_amount");
    amount = Math.round(b.amount * 100) / 100;
  }
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
    name: b.name.trim(),
    amount,
    cat: b.cat,
    note: optional(b.note, 80, "invalid_note"),
    merchant: optional(b.merchant, 60, "invalid_merchant"),
    paymentMethod,
  };
}

// ---- Supabase access. Every query is scoped by user_id: the secret key bypasses RLS, so this is the guard. ----

const toRecord = (r: Tables<"expense_templates">): TemplateRecord => ({
  id: r.id,
  name: r.name,
  amount: r.amount === null ? null : Number(r.amount),
  cat: r.cat,
  ...(r.note ? { note: r.note } : {}),
  ...(r.merchant ? { merchant: r.merchant } : {}),
  ...(isPaymentMethod(r.payment_method) ? { paymentMethod: r.payment_method } : {}),
});

const toColumns = (i: TemplateInput) => ({
  name: i.name,
  amount: i.amount,
  cat: i.cat,
  note: i.note ?? null,
  merchant: i.merchant ?? null,
  payment_method: i.paymentMethod ?? null,
});

export async function listTemplates(scope: Scope) {
  const rows = must(await useSupabase().from("expense_templates").select("*").eq("household_id", scope.householdId).order("created_at").order("id"));
  return (rows ?? []).map(toRecord);
}

export async function createTemplate(scope: Scope, input: TemplateInput) {
  await assertCategoryAllowed(scope, input.cat);
  const db = useSupabase();
  const { count, error } = await db.from("expense_templates").select("id", { count: "exact", head: true }).eq("household_id", scope.householdId);
  if (error) {
    console.error("[supabase]", error.code, error.message);
    throw createError({ statusCode: 500, message: "database_error" });
  }
  if ((count ?? 0) >= MAX_TEMPLATES) throw createError({ statusCode: 409, message: "template_limit" });
  const row = must(await db.from("expense_templates").insert({ user_id: scope.userId, household_id: scope.householdId, ...toColumns(input) }).select().single());
  return toRecord(row!);
}

/** Returns null when the template doesn't exist or belongs to someone else. Past expenses are never touched. */
export async function updateTemplate(scope: Scope, id: string, input: TemplateInput) {
  await assertCategoryAllowed(scope, input.cat);
  const row = must(
    await useSupabase().from("expense_templates").update(toColumns(input)).eq("id", id).eq("household_id", scope.householdId).select().maybeSingle(),
  );
  return row ? toRecord(row) : null;
}

export async function deleteTemplate(scope: Scope, id: string) {
  const row = must(await useSupabase().from("expense_templates").delete().eq("id", id).eq("household_id", scope.householdId).select("id").maybeSingle());
  return !!row;
}
