import { budgetLevel, type BudgetLevel } from "#shared/utils/budgetAlerts";

interface AlertRecord {
  scope: string;
  y: number;
  m: number;
  level: 1 | 2 | 3;
}

const keyOf = (scope: string, y: number, m: number) => `${scope}|${y}|${m}`;

/**
 * Budget alerts. A budget's status (approaching / warning / reached) is always computed from the expenses, so editing or
 * deleting one updates it at once. The one-time announcement (a toast after saving) is remembered per budget and month on the
 * server: each threshold is announced once, so reloading the page never repeats it.
 */
export const useBudgetAlertsStore = defineStore("budgetAlerts", () => {
  const expensesStore = useExpensesStore();
  const categoriesStore = useCategoriesStore();
  const monthAmountStore = useMonthAmountStore();
  const nuxtApp = useNuxtApp(); // captured here: composables are not available after an await
  const demo = isDemo(useRouter().currentRoute.value.query);

  const announced = ref(new Map<string, number>());
  const loaded = ref(false);

  async function load() {
    if (loaded.value || demo) return;
    const fetcher = useRequestFetch(); // forwards the session cookie during SSR
    const rows = await fetcher<AlertRecord[]>("/api/budget-alerts");
    announced.value = new Map(rows.map((r) => [keyOf(r.scope, r.y, r.m), r.level]));
    loaded.value = true;
  }

  function reset() {
    announced.value = new Map();
    loaded.value = false;
  }

  /**
   * After an expense in month (y, m) was saved: find budgets that crossed a threshold not announced yet, remember them,
   * and return the message for the most serious one (or null).
   */
  function announceFor(y: number, m: number): string | null {
    const { t } = nuxtApp.$i18n;
    const spentBy = new Map<string, number>();
    let monthSpent = 0;
    for (const e of expensesStore.expenses) {
      if (e.y !== y || e.m !== m) continue;
      spentBy.set(e.cat, (spentBy.get(e.cat) ?? 0) + e.amount);
      monthSpent += e.amount;
    }

    const budgets: { scope: string; name: string; level: BudgetLevel }[] = [];
    for (const c of categoriesStore.all) {
      const a = categoriesStore.availableFor(c, y, m);
      if (!a) continue;
      budgets.push({ scope: c.key, name: categoriesStore.label(c.key), level: budgetLevel(spentBy.get(c.key) ?? 0, a.available) });
    }
    const main = monthAmountStore.amountFor(y, m);
    if (main !== null) budgets.push({ scope: "month", name: "", level: budgetLevel(monthSpent, main) });

    let best: { scope: string; name: string; level: BudgetLevel } | null = null;
    for (const b of budgets) {
      const key = keyOf(b.scope, y, m);
      if (b.level === 0 || b.level <= (announced.value.get(key) ?? 0)) continue;
      announced.value.set(key, b.level);
      announced.value = new Map(announced.value);
      if (!demo) {
        $fetch("/api/budget-alerts", { method: "PUT", body: { scope: b.scope, y, m, level: b.level } }).catch(() => {});
      }
      if (!best || b.level > best.level) best = b;
    }
    if (!best) return null;
    return best.scope === "month"
      ? t(`budget_alert_month_${best.level}`)
      : t(`budget_alert_cat_${best.level}`, { name: best.name });
  }

  return { announced, loaded, load, reset, announceFor };
});
