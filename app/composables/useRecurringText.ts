import type { Recurring } from "~/types/stores/recurringStore";
import { daysBetween, dueStatus } from "#shared/utils/recurrence";

/** Language-dependent text for recurring rules: when one is due, and how often it repeats. */
export function useRecurringText() {
  const { t } = useI18n();
  const { isoLabel } = useDateLabels();
  const { todayISO } = useExpensesStore();

  /** overdue / today / upcoming (the rule must have a next due date) */
  const status = (r: Recurring) => dueStatus(r.nextDue!, todayISO);

  function dueText(r: Recurring) {
    const days = daysBetween(todayISO, r.nextDue!);
    if (days < 0) return t("due_overdue", { date: isoLabel(r.nextDue!), n: -days });
    if (days === 0) return t("due_today");
    return t("due_in", { n: days, date: isoLabel(r.nextDue!) });
  }

  const repeatText = (r: Recurring) =>
    r.interval === 1 ? t(`freq_${r.frequency}`) : t("recurring_every_n", { n: r.interval, unit: t(`unit_${r.frequency}`) });

  return { status, dueText, repeatText };
}
