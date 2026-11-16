import { MAX_YEAR, MIN_YEAR } from "#shared/utils/limits";

/** Per-person settings. Rollover is off until the person turns it on; `since` is the month it started. */
export interface SettingsRecord {
  rolloverEnabled: boolean;
  rolloverSince: { y: number; m: number } | null;
}

const bad = (message: string) => createError({ statusCode: 400, message });
const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

/** Body: { rolloverEnabled, y, m } where (y, m) is the person's current month (used as the start when turning rollover on). */
export const parseSettingsInput = (body: unknown) => {
  const b = (body ?? {}) as Record<string, unknown>;
  if (typeof b.rolloverEnabled !== "boolean") throw bad("invalid_setting");
  if (!isInt(b.y, MIN_YEAR, MAX_YEAR) || !isInt(b.m, 0, 11)) throw bad("invalid_date");
  return { rolloverEnabled: b.rolloverEnabled, y: b.y, m: b.m };
};

export const getSettings = async (scope: Scope): Promise<SettingsRecord> => {
  const row = must(await useSupabase().from("user_settings").select("*").eq("household_id", scope.householdId).maybeSingle());
  if (!row) return { rolloverEnabled: false, rolloverSince: null };
  return {
    rolloverEnabled: row.rollover_enabled,
    rolloverSince:
      row.rollover_since_y !== null && row.rollover_since_m !== null ? { y: row.rollover_since_y, m: row.rollover_since_m } : null,
  };
};

/**
 * Turn rollover on or off. Turning it ON when it was off starts it this month (the past is never rewritten);
 * turning it OFF keeps every expense and budget as it was.
 */
export const saveSettings = async (scope: Scope, input: { rolloverEnabled: boolean; y: number; m: number }) => {
  const current = await getSettings(scope);
  const since =
    input.rolloverEnabled && !current.rolloverEnabled ? { y: input.y, m: input.m } : current.rolloverSince;
  must(
    await useSupabase()
      .from("user_settings")
      .upsert(
        {
          user_id: scope.userId, household_id: scope.householdId,
          rollover_enabled: input.rolloverEnabled,
          rollover_since_y: since?.y ?? null,
          rollover_since_m: since?.m ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "household_id" },
      ),
  );
  return getSettings(scope);
};
