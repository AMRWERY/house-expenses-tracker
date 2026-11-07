import type { Expense, ExpenseDraft } from "~/types/utils";

type Sheet = { mode: "add" | "edit"; expense?: Expense } | null;

/** The Add/Edit expense bottom sheet: whether it is open, what it edits, and the save/delete outcome. */
export const useSheetStore = defineStore("sheet", () => {
  const expensesStore = useExpensesStore();

  const sheet = ref<Sheet>(null);
  /** i18n key of the last server failure, shown inside the sheet (it stays open when a save fails) */
  const saveError = ref<"save_failed" | "">("");

  function openAdd() {
    saveError.value = "";
    sheet.value = { mode: "add" };
  }
  function openEdit(expense: Expense) {
    saveError.value = "";
    sheet.value = { mode: "edit", expense };
  }
  function close() {
    sheet.value = null;
  }

  /** ?sheet=add|edit opens the sheet on load (used by the preview page). */
  function openFromQuery(query: Record<string, unknown>) {
    if (query.sheet === "add") openAdd();
    else if (query.sheet === "edit" && expensesStore.items[0])
      openEdit(expensesStore.items[0]);
  }

  /** The server must accept a change before the sheet closes. */
  async function save(draft: ExpenseDraft) {
    saveError.value = "";
    try {
      await expensesStore.save(draft, sheet.value?.expense?.id);
      close();
    } catch {
      saveError.value = "save_failed";
    }
  }

  async function remove() {
    saveError.value = "";
    try {
      if (sheet.value?.expense)
        await expensesStore.remove(sheet.value.expense.id);
      close();
    } catch {
      saveError.value = "save_failed";
    }
  }

  return {
    sheet,
    saveError,
    openAdd,
    openEdit,
    close,
    openFromQuery,
    save,
    remove,
  };
});