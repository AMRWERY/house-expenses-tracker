/** Settings > Data: export expenses as CSV, download a JSON backup, restore from one. */
const MAX_BACKUP_BYTES = 20 * 1024 * 1024;

export const useDataTransfer = () => {
  const { t } = useI18n();
  const expensesStore = useExpensesStore();
  const categoriesStore = useCategoriesStore();
  const monthAmountStore = useMonthAmountStore();
  const incomeStore = useIncomeStore();
  const toast = useToastStore();
  const { info } = useCategoryInfo();

  /** which action is running ("" = none) */
  const busy = ref<"backup" | "restore" | "">("");
  /** i18n key of the last failure */
  const error = ref("");

  /** Every expense, oldest first, as a spreadsheet file. Built in the browser from the person's own loaded data. */
  const exportCsv = () => {
    error.value = "";
    const expenseRows = [...expensesStore.expenses]
      .sort((a, b) => toISODate(a.y, a.m, a.day).localeCompare(toISODate(b.y, b.m, b.day)) || a.id - b.id)
      .map((e) => [
        t("csv_expense"),
        toISODate(e.y, e.m, e.day),
        e.amount,
        info(e.cat).label,
        e.merchant ?? "",
        e.paymentMethod ? t(`pay_${e.paymentMethod}`) : "",
        e.note ?? "",
      ]);
    const incomeRows = [...incomeStore.incomes]
      .sort((a, b) => toISODate(a.y, a.m, a.day).localeCompare(toISODate(b.y, b.m, b.day)) || a.id - b.id)
      .map((i) => [t("csv_income"), toISODate(i.y, i.m, i.day), i.amount, t(`income_${i.source}`), "", "", i.note ?? ""]);
    const rows = [...expenseRows, ...incomeRows];
    const header = [t("csv_type"), t("date"), t("amount"), t("category"), t("merchant"), t("payment_method"), t("note")];
    downloadFile(`expenses-${expensesStore.todayISO}.csv`, "text/csv", toCsv([header, ...rows]));
    toast.show({ text: t("export_done", { n: rows.length }) });
  };

  const downloadBackup = async () => {
    if (busy.value) return;
    busy.value = "backup";
    error.value = "";
    try {
      const data = await $fetch("/api/backup");
      downloadFile(`house-expenses-backup-${expensesStore.todayISO}.json`, "application/json", JSON.stringify(data, null, 2));
      toast.show({ text: t("backup_done") });
    } catch {
      error.value = "backup_failed";
    } finally {
      busy.value = "";
    }
  };

  /** Add a backup file's data to the account (nothing is deleted; restoring twice adds nothing new). */
  const restore = async (file: File) => {
    if (busy.value) return;
    error.value = "";
    if (file.size > MAX_BACKUP_BYTES) {
      error.value = "restore_invalid";
      return;
    }
    busy.value = "restore";
    try {
      let body: unknown;
      try {
        body = JSON.parse(await file.text());
      } catch {
        error.value = "restore_invalid";
        return;
      }
      const result = await $fetch<{ added: number; skipped: number }>("/api/backup/restore", { method: "POST", body: body as Record<string, unknown> });
      // Reload everything the restore may have changed.
      expensesStore.reset();
      categoriesStore.reset();
      monthAmountStore.reset();
      incomeStore.reset();
      await Promise.all([expensesStore.load(), categoriesStore.load(), monthAmountStore.load(), incomeStore.load()]);
      toast.show({ text: t("restore_done", { added: result.added, skipped: result.skipped }) });
    } catch (e) {
      const status = (e as { statusCode?: number })?.statusCode;
      error.value = status === 400 ? "restore_invalid" : "restore_failed";
    } finally {
      busy.value = "";
    }
  };

  return { busy, error, exportCsv, downloadBackup, restore };
};
