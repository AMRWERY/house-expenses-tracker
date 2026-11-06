import type { MonthSummary } from "~/types/composables";

/** Totals per month, newest first, each compared with the month before it. */
export function useMonthlyComparison() {
  const { expenses, current, dateLocale } = useExpenses();

  const months = computed<MonthSummary[]>(() => {
    const byMonth = new Map<
      string,
      {
        y: number;
        m: number;
        total: number;
        cats: Partial<Record<CategoryKey, number>>;
      }
    >();
    for (const e of expenses.value) {
      const key = `${e.y}-${e.m}`;
      const row = byMonth.get(key) ?? { y: e.y, m: e.m, total: 0, cats: {} };
      row.total += e.amount;
      row.cats[e.cat] = (row.cats[e.cat] ?? 0) + e.amount;
      byMonth.set(key, row);
    }

    const sorted = [...byMonth.values()].sort(
      (a, b) => b.y * 12 + b.m - (a.y * 12 + a.m),
    );
    const max = Math.max(1, ...sorted.map((r) => r.total));
    const fmt = new Intl.DateTimeFormat(dateLocale.value, {
      month: "long",
      year: "numeric",
    });

    return sorted.map((r, i) => {
      const isCurrent = r.y === current.y && r.m === current.m;
      const older = sorted[i + 1];
      const top = (Object.entries(r.cats) as [CategoryKey, number][]).sort(
        (a, b) => b[1] - a[1],
      )[0];
      return {
        key: `${r.y}-${r.m}`,
        label: fmt.format(new Date(r.y, r.m, 1)),
        total: r.total,
        pct: Math.max(2, Math.round((r.total / max) * 100)),
        topCat: top?.[0] ?? "other",
        isCurrent,
        delta:
          !isCurrent && older
            ? Math.round(((r.total - older.total) / older.total) * 100)
            : null,
      };
    });
  });

  // Stats over completed months only (the current month is still in progress).
  const completed = computed(() => months.value.filter((m) => !m.isCurrent));
  const average = computed(() =>
    completed.value.length
      ? Math.round(
          completed.value.reduce((s, m) => s + m.total, 0) /
            completed.value.length,
        )
      : 0,
  );
  const highest = computed(() =>
    completed.value.reduce<MonthSummary | null>(
      (a, m) => (!a || m.total > a.total ? m : a),
      null,
    ),
  );
  const lowest = computed(() =>
    completed.value.reduce<MonthSummary | null>(
      (a, m) => (!a || m.total < a.total ? m : a),
      null,
    ),
  );

  return { months, average, highest, lowest };
}