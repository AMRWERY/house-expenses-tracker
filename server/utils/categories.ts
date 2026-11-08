import type { Tables } from "~/types/database.types";

/**
 * Every account owns its categories as rows in `categories`. Seven are created for a new account
 * ("defaults", `key` set, `name` null = use the translated name); the rest are custom (`key` null).
 * All of them can be edited and deleted. An expense's `cat` is the default's key or the custom id.
 */
const DEFAULT_CATEGORIES: { key: string; color: string }[] = [
  { key: "groceries", color: "#F97316" },
  { key: "bills", color: "#EAB308" },
  { key: "transport", color: "#3B82F6" },
  { key: "health", color: "#EC4899" },
  { key: "education", color: "#06B6D4" },
  { key: "fun", color: "#F43F5E" },
  { key: "other", color: "#64748B" },
];
export const MAX_CATEGORIES = 30;

export interface CategoryRecord {
  id: string;
  key: string | null;
  name: string | null;
  color: string;
  icon: string;
  /** monthly budget; null = none */
  budget: number | null;
}
/** `name` null keeps/restores a default's translated name; custom categories must have one. */
export type CategoryInput = Pick<CategoryRecord, "name" | "color" | "icon" | "budget">;

const bad = (message: string) => createError({ statusCode: 400, message });
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
const ICON_RE = /^[A-Za-z]{1,24}$/;

/** What an expense stores for this category. */
const refOf = (r: { id: string; key: string | null }) => r.key ?? r.id;

export function parseCategoryId(raw: string | undefined) {
  if (!raw || !UUID_RE.test(raw)) throw bad("invalid_id");
  return raw;
}

/** Validate a request body; never trust the client's shape. (The database re-checks the same rules.) */
export function parseCategoryInput(body: unknown): CategoryInput {
  const b = (body ?? {}) as Record<string, unknown>;
  let name: string | null = null;
  if (b.name !== undefined && b.name !== null) {
    name = typeof b.name === "string" ? b.name.trim() : "";
    if (name.length < 1 || name.length > 24) throw bad("invalid_name");
  }
  if (typeof b.color !== "string" || !COLOR_RE.test(b.color)) throw bad("invalid_color");
  if (typeof b.icon !== "string" || !ICON_RE.test(b.icon)) throw bad("invalid_icon");
  let budget: number | null = null;
  if (b.budget !== undefined && b.budget !== null) {
    if (typeof b.budget !== "number" || !Number.isFinite(b.budget) || b.budget < 0 || b.budget > 1e9)
      throw bad("invalid_budget");
    budget = Math.round(b.budget * 100) / 100;
  }
  return { name, color: b.color.toUpperCase(), icon: b.icon, budget };
}

// ---- Supabase access. Every query is scoped by user_id: the secret key bypasses RLS, so this is the guard. ----

const toRecord = (r: Tables<"categories">): CategoryRecord => ({
  id: r.id,
  key: r.key,
  name: r.name,
  color: r.color,
  icon: r.icon,
  budget: r.budget === null ? null : Number(r.budget), // numeric(12,2): be safe if it arrives as a string
});

/** A brand-new account has no categories yet: give it the defaults. (Deleting the last one is refused.) */
async function ensureSeeded(userId: string) {
  const db = useSupabase();
  const { count, error } = await db.from("categories").select("id", { count: "exact", head: true }).eq("user_id", userId);
  if (error) {
    console.error("[supabase]", error.code, error.message);
    throw createError({ statusCode: 500, message: "database_error" });
  }
  if ((count ?? 0) > 0) return;

  // No categories because the person deleted them all (see deleteCategory): don't bring the defaults back.
  const done = must(await db.from("category_seed_done").select("user_id").eq("user_id", userId).maybeSingle());
  if (done) return;

  // Dated far back, one millisecond apart, so the defaults keep their order and sort before custom ones.
  const base = Date.parse("2000-01-01T00:00:00Z");
  must(
    await db.from("categories").upsert(
      DEFAULT_CATEGORIES.map((c, i) => ({
        user_id: userId,
        key: c.key,
        name: null,
        color: c.color,
        icon: c.key,
        created_at: new Date(base + i + 1).toISOString(),
      })),
      { onConflict: "user_id,key", ignoreDuplicates: true },
    ),
  );
}

export async function listCategories(userId: string) {
  await ensureSeeded(userId);
  const rows = must(
    await useSupabase().from("categories").select("*").eq("user_id", userId).order("created_at").order("id"),
  );
  return (rows ?? []).map(toRecord);
}

export async function createCategory(userId: string, input: CategoryInput) {
  if (input.name === null) throw bad("invalid_name"); // custom categories need a name
  await ensureSeeded(userId);
  const db = useSupabase();
  const { count, error } = await db.from("categories").select("id", { count: "exact", head: true }).eq("user_id", userId);
  if (error) {
    console.error("[supabase]", error.code, error.message);
    throw createError({ statusCode: 500, message: "database_error" });
  }
  if ((count ?? 0) >= MAX_CATEGORIES) throw createError({ statusCode: 409, message: "category_limit" });

  const row = must(await db.from("categories").insert({ user_id: userId, key: null, ...input }).select().single());
  return toRecord(row!);
}

/** Returns null when the category doesn't exist or belongs to someone else. */
export async function updateCategory(userId: string, id: string, input: CategoryInput) {
  const db = useSupabase();
  const existing = must(await db.from("categories").select("id, key").eq("id", id).eq("user_id", userId).maybeSingle());
  if (!existing) return null;
  if (existing.key === null && input.name === null) throw bad("invalid_name"); // a custom category keeps a name

  const row = must(await db.from("categories").update(input).eq("id", id).eq("user_id", userId).select().maybeSingle());
  return row ? toRecord(row) : null;
}

/**
 * Delete any category. Its expenses are kept and moved to "other" (or, if that's the one being deleted
 * or is gone, to the first remaining category) first, so nothing is lost. The last category can be deleted
 * too: its expenses stay as they are (`movedTo` is null).
 * Returns null when it doesn't exist or belongs to someone else, otherwise what the expenses moved to.
 */
export async function deleteCategory(userId: string, id: string) {
  const db = useSupabase();
  const rows =
    must(await db.from("categories").select("id, key").eq("user_id", userId).order("created_at").order("id")) ?? [];
  const target = rows.find((r) => r.id === id);
  if (!target) return null;

  const others = rows.filter((r) => r.id !== id);
  const fallback = others.find((r) => r.key === "other") ?? others[0];

  // The last category: nothing to move the expenses to. They keep their label, and the person must add a
  // category before adding or editing expenses. Remember it, so the defaults are not seeded again.
  if (!fallback) {
    must(await db.from("category_seed_done").upsert({ user_id: userId }, { onConflict: "user_id" }));
    must(await db.from("categories").delete().eq("id", id).eq("user_id", userId));
    return { movedTo: null };
  }

  const movedTo = refOf(fallback);
  must(await db.from("expenses").update({ cat: movedTo }).eq("user_id", userId).eq("cat", refOf(target)));
  must(await db.from("categories").delete().eq("id", id).eq("user_id", userId));
  return { movedTo };
}

/** An expense may only use one of THIS user's categories (a default's key, or a custom id). */
export async function assertCategoryAllowed(userId: string, cat: string) {
  await ensureSeeded(userId);
  const column = UUID_RE.test(cat) ? "id" : "key";
  const row = must(await useSupabase().from("categories").select("id").eq("user_id", userId).eq(column, cat).maybeSingle());
  if (!row) throw bad("invalid_category");
}
