/** The main amount for one month. `m` is 0-based (like Date). */
export interface MonthAmount {
  y: number;
  m: number;
  amount: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The main amount a person sets for each month (e.g. 8000 or 10000). Every month has its own, so a new
 * month starts without one and the home page asks for it. Everything the person spends comes off it
 * ("left"); the category budgets are shown as money "set aside" out of it.
 */
export const useMonthAmountStore = defineStore("monthAmount", () => {
  const expensesStore = useExpensesStore();
  const categoriesStore = useCategoriesStore();
  const demo = isDemo(useRouter().currentRoute.value.query); // preview: local only, nothing is saved

  // ---- State
  const amounts = ref<MonthAmount[]>([]);
  const loaded = ref(false);
  /** The "set the amount" sheet: whether it is open, and the last save outcome. */
  const sheetOpen = ref(false);
  const saving = ref(false);
  const saveError = ref<"save_failed" | "">("");

  // ---- Getters
  const byMonth = computed(() => new Map(amounts.value.map((a) => [`${a.y}-${a.m}`, a.amount])));
  /** The main amount for a month, or null when none was set. */
  const amountFor = (y: number, m: number) => byMonth.value.get(`${y}-${m}`) ?? null;

  /** Everything spent in a month (the category filter doesn't matter here). */
  const spentIn = (y: number, m: number) =>
    round2(expensesStore.expenses.reduce((s, e) => (e.y === y && e.m === m ? s + e.amount : s), 0));

  /** The month being viewed on the home page. */
  const view = computed(() => expensesStore.view);
  const amount = computed(() => amountFor(view.value.y, view.value.m));
  const spent = computed(() => spentIn(view.value.y, view.value.m));
  /** What's left of the main amount (negative = over). Null while the month has no amount. */
  const left = computed(() => (amount.value === null ? null : round2(amount.value - spent.value)));

  /** All category budgets together: the money set aside out of the main amount. */
  const setAside = computed(() => round2(categoriesStore.all.reduce((s, c) => s + (c.budget ?? 0), 0)));
  /** The part of the main amount no category has claimed yet (negative = budgets add up to more). */
  const notSetAside = computed(() => (amount.value === null ? null : round2(amount.value - setAside.value)));

  /** The viewed month is the current one or a later one (past months are never asked for an amount). */
  const canAsk = computed(() => {
    const { current } = expensesStore;
    return view.value.y * 12 + view.value.m >= current.y * 12 + current.m;
  });

  // ---- Actions
  /** Load every month's amount from the server (once per session). */
  async function load() {
    if (loaded.value || demo) return;
    const fetcher = useRequestFetch(); // forwards the session cookie during SSR
    amounts.value = await fetcher<MonthAmount[]>("/api/month-amounts");
    loaded.value = true;
  }

  /** Forget the previous user's data (on sign-out). */
  function reset() {
    amounts.value = [];
    loaded.value = false;
    sheetOpen.value = false;
    saving.value = false;
    saveError.value = "";
  }

  function openSheet() {
    saveError.value = "";
    sheetOpen.value = true;
  }
  function closeSheet() {
    sheetOpen.value = false;
  }

  /** Save the viewed month's amount. The server must accept it before the sheet closes. */
  async function save(value: number) {
    if (saving.value) return;
    saving.value = true;
    saveError.value = "";
    const { y, m } = view.value;
    try {
      const record = demo
        ? { y, m, amount: round2(value) }
        : await $fetch<MonthAmount>("/api/month-amounts", { method: "PUT", body: { y, m, amount: value } });
      amounts.value = [...amounts.value.filter((a) => !(a.y === record.y && a.m === record.m)), record];
      sheetOpen.value = false;
    } catch {
      saveError.value = "save_failed";
    } finally {
      saving.value = false;
    }
  }

  return {
    amounts,
    loaded,
    sheetOpen,
    saving,
    saveError,
    amount,
    spent,
    left,
    setAside,
    notSetAside,
    canAsk,
    amountFor,
    spentIn,
    load,
    reset,
    openSheet,
    closeSheet,
    save,
  };
});
