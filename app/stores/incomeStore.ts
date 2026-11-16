import type { Income, IncomeDraft } from "~/types/stores/incomeStore";

/**
 * Money coming in. It is kept apart from expenses (it never counts against a category budget) and from the month's main
 * amount, which stays a spending limit. Net balance = income - expenses.
 */
export const useIncomeStore = defineStore("income", () => {
  const expensesStore = useExpensesStore();
  const toastStore = useToastStore();
  const nuxtApp = useNuxtApp(); // captured here: composables are not available after an await
  const demo = isDemo(useRouter().currentRoute.value.query); // preview: local only, nothing is saved

  const incomes = ref<Income[]>([]);
  const loaded = ref(false);
  const sheetOpen = ref(false);

  /** Income in the viewed month, newest day first. */
  const monthIncomes = computed(() =>
    incomes.value
      .filter((i) => i.y === expensesStore.view.y && i.m === expensesStore.view.m)
      .sort((a, b) => b.day - a.day || b.id - a.id),
  );
  /** Income inside a period (YYYY-MM-DD, inclusive). */
  const totalBetween = (from: string, to: string) =>
    Math.round(
      incomes.value.reduce((s, i) => {
        const d = toISODate(i.y, i.m, i.day);
        return d >= from && d <= to ? s + i.amount : s;
      }, 0) * 100,
    ) / 100;

  const load = async () => {
    if (loaded.value || demo) return;
    const fetcher = useRequestFetch(); // forwards the session cookie during SSR
    incomes.value = await fetcher<Income[]>("/api/incomes");
    loaded.value = true;
  };

  const reset = () => {
    incomes.value = [];
    loaded.value = false;
    sheetOpen.value = false;
  };

  const openSheet = () => (sheetOpen.value = true);
  const closeSheet = () => (sheetOpen.value = false);

  const toBody = (d: IncomeDraft) => {
    const [y = 0, mo = 1, day = 1] = d.date.split("-").map(Number);
    return { amount: d.amount, source: d.source, y, m: mo - 1, day, note: d.note.trim() || undefined };
  };

  /** Add (no id) or update (with id). Saved on the server first; the list only changes once it accepts (throws otherwise). */
  const save = async (draft: IncomeDraft, id?: number) => {
    const body = toBody(draft);
    const record = demo
      ? { id: id ?? Math.max(0, ...incomes.value.map((i) => i.id)) + 1, ...body }
      : await $fetch<Income>(id ? `/api/incomes/${id}` : "/api/incomes", { method: id ? "PUT" : "POST", body });
    incomes.value = id ? incomes.value.map((i) => (i.id === id ? record : i)) : [...incomes.value, record];
    expensesStore.view = { y: record.y, m: record.m }; // jump to the month it belongs in, so it is visible
    toastStore.show({ text: nuxtApp.$i18n.t(id ? "income_updated" : "income_added") });
  };

  const remove = async (id: number) => {
    if (!demo) await $fetch(`/api/incomes/${id}`, { method: "DELETE" });
    incomes.value = incomes.value.filter((i) => i.id !== id);
    toastStore.show({ text: nuxtApp.$i18n.t("income_deleted") });
  };

  return { incomes, loaded, sheetOpen, monthIncomes, totalBetween, load, reset, openSheet, closeSheet, save, remove };
});
