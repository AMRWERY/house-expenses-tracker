import type { MonthSummary } from "~/types/composables";

interface SpendRow {
  y: number;
  m: number;
  amount: number;
  cat: string;
}
interface AmountRow {
  y: number;
  m: number;
  amount: number;
}

const idx = (y: number, m: number) => y * 12 + m;
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * One summary per calendar month, newest first, with no gaps: from the first month that has an expense
 * or a main amount up to the current month (or a later month that already has a main amount).
 * A month without records is a zero-spend month. Each month is compared with the calendar month
 * right before it, never with "the previous month that has data".
 */
export function buildMonthSummaries(
  expenses: SpendRow[],
  amounts: AmountRow[],
  current: { y: number; m: number },
): MonthSummary[] {
  const totals = new Map<number, { total: number; cats: Record<string, number> }>();
  let first = Infinity;
  let last = -Infinity;
  const touch = (y: number, m: number) => {
    const i = idx(y, m);
    first = Math.min(first, i);
    last = Math.max(last, i);
    return i;
  };
  for (const e of expenses) {
    const i = touch(e.y, e.m);
    const row = totals.get(i) ?? { total: 0, cats: {} };
    row.total += e.amount;
    row.cats[e.cat] = (row.cats[e.cat] ?? 0) + e.amount;
    totals.set(i, row);
  }
  const amountBy = new Map<number, number>();
  for (const a of amounts) amountBy.set(touch(a.y, a.m), a.amount);
  if (first === Infinity) return []; // nothing recorded at all

  const now = idx(current.y, current.m);
  last = Math.max(last, now);

  const chronological: number[] = [];
  for (let i = first; i <= last; i++) chronological.push(i);
  const totalOf = (i: number) => round2(totals.get(i)?.total ?? 0);
  const max = Math.max(1, ...chronological.map(totalOf));

  return chronological
    .map((i): MonthSummary => {
      const y = Math.floor(i / 12);
      const m = i % 12;
      const total = totalOf(i);
      const row = totals.get(i);
      const top = Object.entries(row?.cats ?? {}).sort((a, b) => b[1] - a[1])[0];
      const amount = amountBy.get(i) ?? null;
      const isCurrent = i === now;
      // The month in progress and future months have nothing to compare yet; the first month has no month before it.
      const hasBase = !isCurrent && i < now && i > first;
      const prev = totalOf(i - 1);
      let deltaState: MonthSummary["deltaState"] = "none";
      let delta: number | null = null;
      if (hasBase && prev > 0) {
        deltaState = "pct";
        delta = Math.round(((total - prev) / prev) * 100);
      } else if (hasBase && total > 0) {
        deltaState = "new"; // the month before had no expenses: a percentage would be meaningless
      }
      return {
        key: `${y}-${m}`,
        y,
        m,
        total,
        pct: Math.min(100, Math.max(2, Math.round((total / (amount ?? max)) * 100))),
        topCat: top?.[0] ?? "other",
        isCurrent,
        amount,
        left: amount === null ? null : round2(amount - total),
        delta,
        deltaState,
      };
    })
    .reverse();
}

/**
 * Average, highest and lowest over COMPLETED months only (the month in progress and later ones are left out).
 * Empty months inside the period count as zero.
 */
export function summarizeMonths(months: MonthSummary[], current: { y: number; m: number }) {
  const now = idx(current.y, current.m);
  const completed = months.filter((m) => idx(m.y, m.m) < now);
  const average = completed.length
    ? Math.round(completed.reduce((s, m) => s + m.total, 0) / completed.length)
    : 0;
  let highest: MonthSummary | null = null;
  let lowest: MonthSummary | null = null;
  for (const m of completed) {
    if (!highest || m.total > highest.total) highest = m;
    if (!lowest || m.total < lowest.total) lowest = m;
  }
  return { average, highest, lowest };
}
