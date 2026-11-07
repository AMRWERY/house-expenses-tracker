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
  const view = ref({ y: current.y, m: query.empty ? current.m + 1 : current.m });

  // ---- Getters
  const items = computed(() =>
    expenses.value.filter((e) => e.y === view.value.y && e.m === view.value.m),
  );
  const total = computed(() => items.value.reduce((s, e) => s + e.amount, 0));

  /** The viewed month's expenses grouped by day, newest day first. */
  const groups = computed(() => {
    const byDay = new Map<number, Expense[]>();
    items.value.forEach((e) =>
      byDay.set(e.day, [...(byDay.get(e.day) ?? []), e]),
    );
    return [...byDay.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([day, list]) => ({ day, items: list }));
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
  }

  function shiftMonth(delta: number) {
    const d = new Date(view.value.y, view.value.m + delta, 1);
    view.value = { y: d.getFullYear(), m: d.getMonth() };
  }
  const prevMonth = () => shiftMonth(-1);
  const nextMonth = () => shiftMonth(1);

  /**
   * Add (no id) or update (with id) from a sheet draft, then jump to that month so it's visible.
   * Saved on the server first; the list only changes once the server accepts it (throws otherwise).
   */
  async function save(draft: ExpenseDraft, id?: number) {
    const [y = current.y, mo = current.m + 1, d = 1] = draft.date.split("-").map(Number);
    const data = { cat: draft.cat, amount: draft.amount, y, m: mo - 1, day: d, note: draft.note.trim() || undefined };
    const editing = id !== undefined;

    let record: Expense;
    if (demo) {
      record = { id: editing ? id : Math.max(0, ...expenses.value.map((e) => e.id)) + 1, ...data };
    } else {
      record = await $fetch<Expense>(editing ? `/api/expenses/${id}` : "/api/expenses", {
        method: editing ? "PUT" : "POST",
        body: data,
      });
    }
    expenses.value = editing
      ? expenses.value.map((e) => (e.id === id ? record : e))
      : [...expenses.value, record];
    view.value = { y, m: mo - 1 };
  }

  async function remove(id: number) {
    if (!demo) await $fetch(`/api/expenses/${id}`, { method: "DELETE" });
    expenses.value = expenses.value.filter((e) => e.id !== id);
  }

  return {
    expenses, loaded, view, current, today, todayISO,
    items, total, groups,
    load, reset, prevMonth, nextMonth, save, remove,
  };
});
