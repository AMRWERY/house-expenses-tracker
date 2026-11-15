/** Where income comes from: a label only. */
export const INCOME_SOURCES = ["salary", "freelance", "gift", "refund", "other"] as const;
export type IncomeSource = (typeof INCOME_SOURCES)[number];
export const isIncomeSource = (v: unknown): v is IncomeSource =>
  typeof v === "string" && (INCOME_SOURCES as readonly string[]).includes(v);
