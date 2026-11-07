import type { CategoryDraft, CategoryErrorKey, CustomCategory } from "~/types/stores/categoriesStore";

/** The "Categories" bottom sheet on the home page: the list, and the add/edit form inside it. */
export const useCategorySheetStore = defineStore("categorySheet", () => {
  const categoriesStore = useCategoriesStore();

  const isOpen = ref(false);
  const view = ref<"list" | "form">("list");
  /** the category being edited; null while adding a new one */
  const editing = ref<CustomCategory | null>(null);
  const error = ref<CategoryErrorKey | "">("");
  const busy = ref(false);

  function open() {
    view.value = "list";
    editing.value = null;
    error.value = "";
    isOpen.value = true;
  }
  function close() {
    isOpen.value = false;
  }

  function startAdd() {
    editing.value = null;
    error.value = "";
    view.value = "form";
  }
  function startEdit(category: CustomCategory) {
    editing.value = category;
    error.value = "";
    view.value = "form";
  }
  function backToList() {
    error.value = "";
    view.value = "list";
  }

  const statusOf = (e: unknown) => {
    const err = e as { statusCode?: number; status?: number; data?: { message?: string } };
    return { status: err.statusCode ?? err.status, message: err.data?.message };
  };

  /** Run a server change; on success go back to the list, otherwise stay on the form with a message. */
  async function run(action: () => Promise<void>) {
    if (busy.value) return;
    busy.value = true;
    error.value = "";
    try {
      await action();
      backToList();
    } catch (e) {
      error.value = statusOf(e).message === "category_limit" ? "category_limit" : "save_failed";
    } finally {
      busy.value = false;
    }
  }

  const save = (draft: CategoryDraft) =>
    run(() => (editing.value ? categoriesStore.update(editing.value.id, draft) : categoriesStore.add(draft)));

  const remove = () =>
    run(async () => {
      if (editing.value) await categoriesStore.remove(editing.value.id);
    });

  return { isOpen, view, editing, error, busy, open, close, startAdd, startEdit, backToList, save, remove };
});
