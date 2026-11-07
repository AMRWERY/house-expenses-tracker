import type { IconName } from "~/utils/icons";

/** A category the person created (stored on the server). */
export interface CustomCategory {
  id: string;
  name: string;
  color: string;
  icon: IconName;
}

/** What the category form hands back. */
export type CategoryDraft = Omit<CustomCategory, "id">;

/** Any category an expense can use: built-in (named by i18n) or custom (named by the person). */
export interface Category {
  /** built-in key, or the custom category's id: this is what `expense.cat` holds */
  key: string;
  builtin: boolean;
  /** custom categories only; built-ins are named by `categories.<key>` in the locale files */
  name?: string;
  color: string;
  icon: IconName;
}

/** i18n key of the last category-management failure. */
export type CategoryErrorKey = "save_failed" | "category_limit" | "category_name_required";
