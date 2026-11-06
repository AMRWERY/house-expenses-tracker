import type { Expense, ExpenseDraft } from "~/types/utils";

export const CATEGORY_KEYS = [
  "groceries",
  "bills",
  "transport",
  "health",
  "education",
  "fun",
  "other",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

// Names live in the locale files under `categories.<key>`; icons share the same keys.
export const CATEGORY_COLORS: Record<CategoryKey, string> = {
  groceries: "#F97316",
  bills: "#EAB308",
  transport: "#3B82F6",
  health: "#EC4899",
  education: "#06B6D4",
  fun: "#F43F5E",
  other: "#64748B",
};
