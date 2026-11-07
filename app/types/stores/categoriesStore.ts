import type { IconName } from "~/utils/icons";

/**
 * A category the person can use, edit and delete. The 7 defaults (groceries, bills, ...) and the ones
 * they add are the same kind of thing; a default just has a `defaultKey` and, until renamed, no `name`.
 */
export interface Category {
  /** what `expense.cat` holds: the default's key (e.g. "groceries") or the custom category's id */
  key: string;
  /** server row id (used to edit/delete) */
  id: string;
  /** set for the 7 defaults: their translated name is `categories.<defaultKey>` until renamed */
  defaultKey?: string;
  /** the person's own name; absent for a default that still uses its translated name */
  name?: string;
  color: string;
  icon: IconName;
}

/** What the category form hands back. `name` null = keep a default's translated name. */
export interface CategoryDraft {
  name: string | null;
  color: string;
  icon: IconName;
}

/** i18n key of the last category-management failure. */
export type CategoryErrorKey = "save_failed" | "category_limit";
