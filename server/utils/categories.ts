import type { Tables } from "~/types/database.types";

/** Built-in categories live in code; custom ones are rows in `categories`. */
export const BUILTIN_CATEGORIES = ["groceries", "bills", "transport", "health", "education", "fun", "other"];
export const MAX_CUSTOM_CATEGORIES = 30;

export interface CategoryRecord {
  id: string;
  name: string;
  color: string;
  icon: string;
}
export type CategoryInput = Omit<CategoryRecord, "id">;

const bad = (message: string) => createError({ statusCode: 400, message });
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
const ICON_RE = /^[A-Za-z]{1,24}$/;

export function parseCategoryId(raw: string | undefined) {
  if (!raw || !UUID_RE.test(raw)) throw bad("invalid_id");
  return raw;
}

/** Validate a request body; never trust the client's shape. (The database re-checks the same rules.) */
export function parseCategoryInput(body: unknown): CategoryInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (name.length < 1 || name.length > 24) throw bad("invalid_name");
  if (typeof b.color !== "string" || !COLOR_RE.test(b.color)) throw bad("invalid_color");
  if (typeof b.icon !== "string" || !ICON_RE.test(b.icon)) throw bad("invalid_icon");
  return { name, color: b.color.toUpperCase(), icon: b.icon };
}

// ---- Supabase access. Every query is scoped by user_id: the secret key bypasses RLS, so this is the guard. ----

const toRecord = (r: Tables<"categories">): CategoryRecord => ({ id: r.id, name: r.name, color: r.color, icon: r.icon });

export async function listCategories(userId: string) {
  const rows = must(
    await useSupabase().from("categories").select("*").eq("user_id", userId).order("created_at").order("id"),
  );
  return (rows ?? []).map(toRecord);
}

export async function createCategory(userId: string, input: CategoryInput) {
  const db = useSupabase();
  const { count, error } = await db.from("categories").select("id", { count: "exact", head: true }).eq("user_id", userId);
  if (error) {
    console.error("[supabase]", error.code, error.message);
    throw createError({ statusCode: 500, message: "database_error" });
  }
  if ((count ?? 0) >= MAX_CUSTOM_CATEGORIES) throw createError({ statusCode: 409, message: "category_limit" });

  const row = must(await db.from("categories").insert({ user_id: userId, ...input }).select().single());
  return toRecord(row!);
}

/** Returns null when the category doesn't exist or belongs to someone else. */
export async function updateCategory(userId: string, id: string, input: CategoryInput) {
  const row = must(
    await useSupabase().from("categories").update(input).eq("id", id).eq("user_id", userId).select().maybeSingle(),
  );
  return row ? toRecord(row) : null;
}

/**
 * Delete a custom category. Its expenses are kept and moved to "other" first, so nothing is lost.
 * Returns false when the category doesn't exist or belongs to someone else.
 */
export async function deleteCategory(userId: string, id: string) {
  const db = useSupabase();
  const owned = must(await db.from("categories").select("id").eq("id", id).eq("user_id", userId).maybeSingle());
  if (!owned) return false;

  must(await db.from("expenses").update({ cat: "other" }).eq("user_id", userId).eq("cat", id));
  must(await db.from("categories").delete().eq("id", id).eq("user_id", userId));
  return true;
}

/** An expense may use a built-in key or one of THIS user's custom categories. */
export async function assertCategoryAllowed(userId: string, cat: string) {
  if (BUILTIN_CATEGORIES.includes(cat)) return;
  if (!UUID_RE.test(cat)) throw bad("invalid_category");
  const row = must(await useSupabase().from("categories").select("id").eq("id", cat).eq("user_id", userId).maybeSingle());
  if (!row) throw bad("invalid_category");
}
