import type { Expense, ExpenseDraft } from "~/types/utils";

type Sheet = { mode: "add" | "edit"; expense?: Expense } | null;

/** The Add/Edit expense bottom sheet: whether it is open, what it edits, and the save/delete outcome. */
export const useSheetStore = defineStore("sheet", () => {
  const expensesStore = useExpensesStore();

  const sheet = ref<Sheet>(null);
  /** i18n key of the last server failure, shown inside the sheet (it stays open when a save fails) */
  const saveError = ref<"save_failed" | "">("");

  /** which request is in flight ("" = none); the sheet labels its buttons from it */
  const busy = ref<"save" | "delete" | "">("");

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
    await run("save", () => expensesStore.save(draft, sheet.value?.expense?.id));
  }

  async function remove() {
    await run("delete", async () => {
      if (sheet.value?.expense)
        await expensesStore.remove(sheet.value.expense.id);
    });
  }

  /** Run a server change with a busy flag (blocks double taps); close on success, show the error otherwise. */
  async function run(kind: "save" | "delete", action: () => Promise<void>) {
    if (busy.value) return;
    busy.value = kind;
    saveError.value = "";
    try {
      await action();
      close();
    } catch {
      saveError.value = "save_failed";
    } finally {
      busy.value = "";
    }
  }

  return {
    sheet,
    saveError,
    busy,
    openAdd,
    openEdit,
    close,
    openFromQuery,
    save,
    remove,
  };
});