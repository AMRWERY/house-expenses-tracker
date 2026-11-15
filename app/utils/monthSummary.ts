import { addDays, daysBetween } from "#shared/utils/recurrence";

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface SummaryInput {
  /** the period, inclusive (YYYY-MM-DD): a month, or a picked date range */
  from: string;
  to: string;
  today: string;
  /** the expenses inside the period (not narrowed by category or search) */
  expenses: { y: number; m: number; day: number; amount: number; cat: string }[];
  incomeTotal: number;
  /** total spent in the calendar month before; null when the period is not a single month */
  prevMonthTotal: number | null;
  /** the main amount for the month; null when none is set or the period is not a single month */
  mainAmount: number | null;
}

const iso = (e: { y: number; m: number; day: number }) =>
  `${e.y}-${String(e.m + 1).padStart(2, "0")}-${String(e.day).padStart(2, "0")}`;

/**
 * Everything the short written summary says, as plain numbers: each statement the screen shows is one of these values,
 * calculated only from the person's records.
 */
export function summarize(i: SummaryInput) {
  const expenseTotal = round2(i.expenses.reduce((s, e) => s + e.amount, 0));
  const byCat = new Map<string, number>();
  for (const e of i.expenses) byCat.set(e.cat, (byCat.get(e.cat) ?? 0) + e.amount);
  const top = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];

  // Compared with the month before, only once the month is over (a month in progress is not comparable)
  let deltaState: "pct" | "new" | "none" = "none";
  let deltaPct: number | null = null;
  if (i.prevMonthTotal !== null && i.to < i.today) {
    if (i.prevMonthTotal > 0) {
      deltaState = "pct";
      deltaPct = Math.round(((expenseTotal - i.prevMonthTotal) / i.prevMonthTotal) * 100);
    } else if (expenseTotal > 0) deltaState = "new";
  }

  // Days with no expense RECORDED (not "days nothing was spent": a missing record is possible), up to today
  const last = i.to < i.today ? i.to : i.today;
  let freeDays: { days: number; of: number } | null = null;
  if (i.from <= last) {
    const of = daysBetween(i.from, last) + 1;
    const withExpenses = new Set(i.expenses.map(iso).filter((d) => d >= i.from && d <= last)).size;
    freeDays = { days: of - withExpenses, of };
  }

  return {
    expenseTotal,
    expenseCount: i.expenses.length,
    topCat: top ? { cat: top[0], total: round2(top[1]) } : null,
    incomeTotal: round2(i.incomeTotal),
    net: round2(i.incomeTotal - expenseTotal),
    left: i.mainAmount === null ? null : round2(i.mainAmount - expenseTotal),
    deltaState,
    deltaPct,
    freeDays,
  };
}

/** The last day of a month as YYYY-MM-DD (`m` is 0-based). */
export const monthBounds = (y: number, m: number) => {
  const from = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const next = m === 11 ? `${y + 1}-01-01` : `${y}-${String(m + 2).padStart(2, "0")}-01`;
  return { from, to: addDays(next, -1) };
};
