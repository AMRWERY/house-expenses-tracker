import { MAX_YEAR, MIN_YEAR } from "#shared/utils/limits";

/** The highest budget threshold already announced for each budget and month (so an alert shows once). */
export interface BudgetAlertRecord {
  scope: string;
  y: number;
  m: number;
  level: 1 | 2 | 3;
}

const bad = (message: string) => createError({ statusCode: 400, message });
const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

export function parseBudgetAlert(body: unknown): BudgetAlertRecord {
  const b = (body ?? {}) as Record<string, unknown>;
  // 'month' = the main amount; anything else is a category reference (a default's key or a custom category id)
  if (typeof b.scope !== "string" || !/^[A-Za-z0-9_-]{1,40}$/.test(b.scope)) throw bad("invalid_scope");
  if (!isInt(b.y, MIN_YEAR, MAX_YEAR) || !isInt(b.m, 0, 11)) throw bad("invalid_date");
  if (!isInt(b.level, 1, 3)) throw bad("invalid_level");
  return { scope: b.scope, y: b.y, m: b.m, level: b.level as 1 | 2 | 3 };
}

/** What THIS person was already told, in the household they are looking at (an announcement is personal). */
export async function listBudgetAlerts(scope: Scope): Promise<BudgetAlertRecord[]> {
  const rows = must(
    await useSupabase().from("budget_alerts").select("*").eq("user_id", scope.userId).eq("household_id", scope.householdId),
  );
  return (rows ?? []).map((r) => ({ scope: r.scope, y: r.y, m: r.m, level: r.level as 1 | 2 | 3 }));
}

/** Remember that a threshold was announced. The level only ever goes up, so a retry or a second device cannot lower it. */
export async function raiseBudgetAlert(scope: Scope, input: BudgetAlertRecord) {
  const db = useSupabase();
  const existing = must(
    await db.from("budget_alerts").select("level").eq("user_id", scope.userId).eq("household_id", scope.householdId).eq("scope", input.scope).eq("y", input.y).eq("m", input.m).maybeSingle(),
  );
  const level = Math.max(existing?.level ?? 0, input.level) as 1 | 2 | 3;
  must(
    await db
      .from("budget_alerts")
      .upsert(
        { user_id: scope.userId, household_id: scope.householdId, ...input, level, updated_at: new Date().toISOString() },
        { onConflict: "user_id,household_id,scope,y,m" },
      ),
  );
  return { ...input, level };
}
