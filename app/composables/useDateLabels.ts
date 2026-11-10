/** Language-dependent date text for the expense screens (the stores hold only raw numbers). */
export function useDateLabels() {
  const { t, locale } = useI18n();
  const expensesStore = useExpensesStore();

  const dateLocale = computed(() => (locale.value === "ar" ? "ar-EG-u-nu-latn" : "en-US"));

  /** "November 2026" */
  const monthName = (y: number, m: number) =>
    new Intl.DateTimeFormat(dateLocale.value, { month: "long", year: "numeric" }).format(new Date(y, m, 1));

  /** Label of the month being viewed. */
  const monthLabel = computed(() => {
    const { y, m } = expensesStore.view;
    return monthName(y, m);
  });

  /** "Today", "Yesterday" or "5 November" for a day of the viewed month (or of the given year/month, for a date range). */
  const dayLabel = (d: number, y?: number, m?: number) => {
    const { today, view } = expensesStore;
    const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const date = new Date(y ?? view.y, m ?? view.m, d);
    const diff = Math.round((t0.getTime() - date.getTime()) / 864e5);
    if (diff === 0) return t("today");
    if (diff === 1) return t("yesterday");
    return new Intl.DateTimeFormat(dateLocale.value, {
      day: "numeric",
      month: "long",
      ...(y !== undefined && y !== today.getFullYear() ? { year: "numeric" } : {}),
    }).format(date);
  };

  /** "5 November" / "5 November 2026" for a YYYY-MM-DD string (no Today/Yesterday). */
  const isoLabel = (iso: string) => {
    const [y = 0, m = 1, d = 1] = iso.split("-").map(Number);
    return new Intl.DateTimeFormat(dateLocale.value, { day: "numeric", month: "short", year: "numeric" }).format(new Date(y, m - 1, d));
  };

  return { dateLocale, monthName, monthLabel, dayLabel, isoLabel };
}
