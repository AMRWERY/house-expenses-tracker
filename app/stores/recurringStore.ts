import type { Expense } from "~/types/utils";
import type { Recurring, RecurringDraft, RecurringView } from "~/types/stores/recurringStore";
import { reminderActive } from "#shared/utils/recurrence";

/**
 * Recurring expenses: rent, internet, subscriptions. A rule never adds an expense by itself: its next occurrence shows up as
 * "due" and the person confirms it (they can change the amount first) or skips it. Reminders are in-app only.
 */
export const useRecurringStore = defineStore("recurring", () => {
  const expensesStore = useExpensesStore();
  const toastStore = useToastStore();
  const nuxtApp = useNuxtApp(); // captured here: composables are not available after an await
  const demo = isDemo(useRouter().currentRoute.value.query); // preview: local only, nothing is saved

  const rules = ref<Recurring[]>([]);
  const loaded = ref(false);
  /** The sheet: closed (null), the list, the rule form, or confirming one occurrence. */
  const sheet = ref<RecurringView | null>(null);
  const busy = ref<"save" | "delete" | "confirm" | "skip" | "toggle" | "">("");
  /** i18n key of the last failure, shown in the sheet */
  const error = ref("");

  // ---- Getters
  const today = computed(() => expensesStore.todayISO);
  /** Active rules with an occurrence waiting, soonest first. */
  const waiting = computed(() =>
    rules.value.filter((r) => r.active && r.nextDue !== null).sort((a, b) => a.nextDue!.localeCompare(b.nextDue!)),
  );
  /** The waiting ones whose reminder has started (on the due date, or the chosen days before). */
  const due = computed(() => waiting.value.filter((r) => reminderActive(r.nextDue!, r.remindDaysBefore, today.value)));
  const overdueCount = computed(() => due.value.filter((r) => r.nextDue! < today.value).length);

  // ---- Actions
  const load = async () => {
    if (loaded.value || demo) return;
    const fetcher = useRequestFetch(); // forwards the session cookie during SSR
    rules.value = await fetcher<Recurring[]>("/api/recurring");
    loaded.value = true;
  };

  const reset = () => {
    rules.value = [];
    loaded.value = false;
    sheet.value = null;
    busy.value = "";
    error.value = "";
  };

  const openList = () => {
    error.value = "";
    sheet.value = { view: "list" };
  };
  const openForm = (rule?: Recurring) => {
    error.value = "";
    sheet.value = { view: "form", rule };
  };
  const openConfirm = (rule: Recurring) => {
    error.value = "";
    sheet.value = { view: "confirm", rule };
  };
  const close = () => {
    sheet.value = null;
  };

  /** Run a request with a busy flag (blocks double taps); the error key stays in the sheet on failure. */
  const run = async <T>(kind: Exclude<typeof busy.value, "">, action: () => Promise<T>): Promise<T | undefined> => {
    if (busy.value) return;
    busy.value = kind;
    error.value = "";
    try {
      return await action();
    } catch (e) {
      const status = (e as { statusCode?: number })?.statusCode;
      const message = (e as { data?: { message?: string } })?.data?.message;
      if (status === 409 && message === "already_handled") {
        error.value = "recurring_already_handled";
        rules.value = []; // out of date: another tap or device handled it
        loaded.value = false;
        load().catch(() => {});
      } else if (status === 409 && message === "recurring_limit") error.value = "recurring_limit";
      else error.value = "save_failed";
    } finally {
      busy.value = "";
    }
  };

  const body = (d: RecurringDraft) => ({
    title: d.title.trim(),
    amount: d.amount,
    cat: d.cat,
    note: d.note.trim() || undefined,
    merchant: d.merchant.trim() || undefined,
    paymentMethod: d.paymentMethod ?? undefined,
    frequency: d.frequency,
    interval: d.interval,
    startDate: d.startDate,
    endDate: d.endDate || null,
    remindDaysBefore: d.remindDaysBefore,
    today: today.value, // the person's own date, so schedules resume correctly in their time zone
  });

  /** Create or update a rule. Returns true when the server accepted it. */
  const save = async (draft: RecurringDraft, id?: string) => {
    const record = await run("save", () =>
      $fetch<Recurring>(id ? `/api/recurring/${id}` : "/api/recurring", { method: id ? "PUT" : "POST", body: body(draft) }),
    );
    if (!record) return false;
    rules.value = id ? rules.value.map((r) => (r.id === id ? record : r)) : [...rules.value, record];
    return true;
  };

  const remove = async (id: string) => {
    const ok = await run("delete", async () => {
      await $fetch(`/api/recurring/${id}`, { method: "DELETE" });
      return true;
    });
    if (ok) rules.value = rules.value.filter((r) => r.id !== id);
    return !!ok;
  };

  const setActive = async (rule: Recurring, active: boolean) => {
    const record = await run("toggle", () =>
      $fetch<Recurring>(`/api/recurring/${rule.id}/active`, { method: "PUT", body: { active, today: today.value } }),
    );
    if (record) rules.value = rules.value.map((r) => (r.id === rule.id ? record : r));
  };

  /** Confirm the waiting occurrence: adds the expense (with the given amount, if it differs) and moves the rule on. */
  const confirm = async (rule: Recurring, amount: number) => {
    if (!rule.nextDue) return false;
    const result = await run("confirm", () =>
      $fetch<{ rule: Recurring; expense: Expense }>(`/api/recurring/${rule.id}/confirm`, {
        method: "POST",
        body: { date: rule.nextDue, amount },
      }),
    );
    if (!result) return false;
    rules.value = rules.value.map((r) => (r.id === rule.id ? result.rule : r));
    expensesStore.insertRecord(result.expense);
    const { t } = nuxtApp.$i18n;
    const alert = useBudgetAlertsStore().announceFor(result.expense.y, result.expense.m);
    toastStore.show({ text: alert ? `${t("recurring_confirmed")}. ${alert}` : t("recurring_confirmed") }, alert ? 6000 : 4000);
    return true;
  };

  const skip = async (rule: Recurring) => {
    if (!rule.nextDue) return false;
    const result = await run("skip", () =>
      $fetch<{ rule: Recurring }>(`/api/recurring/${rule.id}/skip`, { method: "POST", body: { date: rule.nextDue } }),
    );
    if (!result) return false;
    rules.value = rules.value.map((r) => (r.id === rule.id ? result.rule : r));
    toastStore.show({ text: nuxtApp.$i18n.t("recurring_skipped") });
    return true;
  };

  /** On opening the app: say once which payments are due. Each occurrence is announced a single time (remembered on the server). */
  const announceReminders = () => {
    const fresh = due.value.filter((r) => r.lastRemindedFor !== r.nextDue);
    if (!fresh.length) return;
    const { t } = nuxtApp.$i18n;
    toastStore.show({
      text: fresh.length === 1 ? t("recurring_reminder_one", { title: fresh[0]!.title }) : t("recurring_reminder_many", { n: fresh.length }),
      actionLabel: t("review"),
      onAction: openList,
    }, 6000);
    for (const r of fresh) {
      r.lastRemindedFor = r.nextDue;
      if (!demo) $fetch(`/api/recurring/${r.id}/reminded`, { method: "PUT", body: { date: r.nextDue } }).catch(() => {});
    }
  };

  /** A category was deleted: the server moved its rules, so mirror it here. */
  const reassignCategory = (from: string, to: string) => {
    rules.value = rules.value.map((r) => (r.cat === from ? { ...r, cat: to } : r));
  };

  return {
    rules,
    loaded,
    sheet,
    busy,
    error,
    waiting,
    due,
    overdueCount,
    load,
    reset,
    openList,
    openForm,
    openConfirm,
    close,
    save,
    remove,
    setActive,
    confirm,
    skip,
    announceReminders,
    reassignCategory,
  };
});
