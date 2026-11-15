/** Totals per calendar month, newest first, each compared with the calendar month right before it. */
export const useComparisonStore = defineStore("comparison", () => {
  const expensesStore = useExpensesStore();
  const monthAmountStore = useMonthAmountStore();

  const months = computed(() =>
    buildMonthSummaries(expensesStore.expenses, monthAmountStore.amounts, expensesStore.current),
  );
  const stats = computed(() => summarizeMonths(months.value, expensesStore.current));
  const average = computed(() => stats.value.average);
  const highest = computed(() => stats.value.highest);
  const lowest = computed(() => stats.value.lowest);

  return { months, average, highest, lowest };
});
