import type { Expense, ExpenseDraft } from "~/types/utils";

/**
 * The signed-in person's expenses and the month being viewed.
 * Real users get their list from the server (loaded by the auth middleware); sample data is dev-preview only.
 * Display text (month names, "Today", ...) is NOT here: it depends on the language, see useDateLabels().
 */
export const useExpensesStore = defineStore("expenses", () => {
  // Preview switches (?demo=1, ?today=YYYY-MM-DD, ?empty=1). Read from the router, not useRoute(),
  // because the store may first be created inside the auth middleware.
  const query = useRouter().currentRoute.value.query;
  const demo = isDemo(query);
  const today = new Date(
    typeof query.today === "string" ? `${query.today}T12:00:00` : Date.now(),
  );
  const current = { y: today.getFullYear(), m: today.getMonth() };
  const todayISO = toISODate(current.y, current.m, today.getDate());

  // ---- State
  const expenses = ref<Expense[]>(demo ? buildDemoExpenses(today) : []);
  const loaded = ref(false);
  const view = ref({
    y: current.y,
    m: query.empty ? current.m + 1 : current.m,
  });

  /** Home-page filter: show only this category (its key), or everything when null. */
  const filterCat = ref<string | null>(null);

  /** True until the first server load finishes (the home page shows skeleton rows meanwhile). */
  const loading = computed(() => !loaded.value && !demo);
  /** The expense being added right now: the list shows one skeleton row for it until the server answers. */
  const pending = ref<{ y: number; m: number; day: number } | null>(null);
  /** The expense being updated or deleted right now: its row shows as a skeleton until the server answers. */
  const busyId = ref<number | null>(null);

  // ---- Getters
  /** Everything spent in the viewed month (budgets are measured against this, ignoring the filter). */
  const monthItems = computed(() =>
    expenses.value.filter((e) => e.y === view.value.y && e.m === view.value.m),
  );
  /** What the home page lists: the viewed month, narrowed by the category filter. */
  const items = computed(() =>
    filterCat.value ? monthItems.value.filter((e) => e.cat === filterCat.value) : monthItems.value,
  );
  const total = computed(() => items.value.reduce((s, e) => s + e.amount, 0));

  /** The viewed month's expenses grouped by day, newest day first. */
  const groups = computed(() => {
    const byDay = new Map<number, Expense[]>();
    items.value.forEach((e) =>
      byDay.set(e.day, [...(byDay.get(e.day) ?? []), e]),
    );
    // The expense being added gets its day group (and a skeleton row at the end of it) right away.
    const p = pending.value;
    const pendingDay = p && p.y === view.value.y && p.m === view.value.m ? p.day : null;
    if (pendingDay !== null && !byDay.has(pendingDay)) byDay.set(pendingDay, []);
    return [...byDay.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([day, list]) => ({ day, items: list, pending: day === pendingDay }));
  });

  // ---- Actions
  /** Load the signed-in user's expenses from the server (once per session). */
  async function load() {
    if (loaded.value) return;
    const fetcher = useRequestFetch(); // forwards the session cookie during SSR
    expenses.value = await fetcher<Expense[]>("/api/expenses");
    loaded.value = true;
  }

  /** Forget the previous user's data (on sign-out). */
  function reset() {
    expenses.value = [];
    loaded.value = false;
    filterCat.value = null;
    pending.value = null;
    busyId.value = null;
  }

  const setFilter = (key: string | null) => (filterCat.value = key);

  /** After a category is deleted the server moves its expenses; mirror that here. */
  function reassignCategory(from: string, to: string) {
    expenses.value = expenses.value.map((e) => (e.cat === from ? { ...e, cat: to } : e));
    if (filterCat.value === from) filterCat.value = null; // the filtered category is gone
  }

  /** The home page never goes back before this month (November 2026). The dev preview is not limited. */
  const FIRST_MONTH = { y: 2026, m: 10 };
  const FIRST_DAY_ISO = toISODate(FIRST_MONTH.y, FIRST_MONTH.m, 1);
  const canGoPrev = computed(
    () => demo || view.value.y * 12 + view.value.m > FIRST_MONTH.y * 12 + FIRST_MONTH.m,
  );

  function shiftMonth(delta: number) {
    const d = new Date(view.value.y, view.value.m + delta, 1);
    const target = { y: d.getFullYear(), m: d.getMonth() };
    if (!demo && target.y * 12 + target.m < FIRST_MONTH.y * 12 + FIRST_MONTH.m) return;
    view.value = target;
  }
  const prevMonth = () => shiftMonth(-1);
  const nextMonth = () => shiftMonth(1);

  /**
   * Add (no id) or update (with id) from a sheet draft, then jump to that month (and drop a non-matching category filter) so it's visible.
   * Saved on the server first; the list only changes once the server accepts it (throws otherwise).
   */
  async function save(draft: ExpenseDraft, id?: number) {
    const [y = current.y, mo = current.m + 1, d = 1] = draft.date
      .split("-")
      .map(Number);
    const data = {
      cat: draft.cat,
      amount: draft.amount,
      y,
      m: mo - 1,
      day: d,
      note: draft.note.trim() || undefined,
    };
    const editing = id !== undefined;

    // Updating: that row becomes a skeleton while the server works.
    if (editing) busyId.value = id;
    // Adding: go to the month it belongs in and show a skeleton row for it while the server works.
    else {
      view.value = { y, m: mo - 1 };
      if (filterCat.value && filterCat.value !== data.cat) filterCat.value = null;
      pending.value = { y, m: mo - 1, day: d };
    }

    let record: Expense;
    try {
      const request: Promise<Expense> = demo
        ? Promise.resolve({
            id: editing ? id : Math.max(0, ...expenses.value.map((e) => e.id)) + 1,
            ...data,
          })
        : $fetch<Expense>(editing ? `/api/expenses/${id}` : "/api/expenses", {
            method: editing ? "PUT" : "POST",
            body: data,
          });
      record = await atLeastSkeletonTime(request);
    } catch (e) {
      pending.value = null; // failed: the skeleton goes away and the sheet shows the error
      busyId.value = null;
      throw e;
    }
    pending.value = null;
    busyId.value = null;
    expenses.value = editing
      ? expenses.value.map((e) => (e.id === id ? record : e))
      : [...expenses.value, record];
    view.value = { y, m: mo - 1 };
    // A category filter would hide an expense saved under a different category until a reload.
    if (filterCat.value && filterCat.value !== data.cat) filterCat.value = null;
  }

  async function remove(id: number) {
    busyId.value = id; // its row shows as a skeleton until the server answers
    try {
      await atLeastSkeletonTime(demo ? Promise.resolve() : $fetch(`/api/expenses/${id}`, { method: "DELETE" }));
      expenses.value = expenses.value.filter((e) => e.id !== id);
    } finally {
      busyId.value = null; // on failure the row comes back and the sheet shows the error
    }
  }

  return {
    expenses,
    loaded,
    view,
    current,
    today,
    todayISO,
    filterCat,
    loading,
    pending,
    busyId,
    monthItems,
    items,
    total,
    groups,
    load,
    reset,
    reassignCategory,
    setFilter,
    prevMonth,
    nextMonth,
    canGoPrev,
    firstDayISO: FIRST_DAY_ISO,
    save,
    remove,
  };
});