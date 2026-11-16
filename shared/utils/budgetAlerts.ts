/**
 * Budget status thresholds, shared by the app and the server.
 * Level 1 = 70% used (approaching), 2 = 85% (warning), 3 = 100% or more (reached / exceeded).
 */
export const BUDGET_THRESHOLDS = [70, 85, 100] as const;
export type BudgetLevel = 0 | 1 | 2 | 3;

/** Which threshold the spending has reached. A zero budget counts as reached as soon as anything is spent. */
export const budgetLevel = (spent: number, budget: number): BudgetLevel => {
  if (budget <= 0) return spent > 0 ? 3 : 0;
  // Compare in whole-percent space on the cents, so 85.00% exactly counts as 85%
  const used = Math.round(spent * 100) * 100;
  const limit = Math.round(budget * 100);
  if (used >= limit * BUDGET_THRESHOLDS[2]) return 3;
  if (used >= limit * BUDGET_THRESHOLDS[1]) return 2;
  if (used >= limit * BUDGET_THRESHOLDS[0]) return 1;
  return 0;
};
