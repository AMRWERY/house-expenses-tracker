import type { Category, CategoryDraft, CategoryErrorKey } from "~/types/stores/categoriesStore";

/** The "Categories" bottom sheet on the home page: the list, and the add/edit/delete form inside it. */
export const useCategorySheetStore = defineStore("categorySheet", () => {
  const categoriesStore = useCategoriesStore();

  const isOpen = ref(false);
  const view = ref<"list" | "form">("list");
  /** the category being edited; null while adding a new one */
  const editing = ref<Category | null>(null);
  const error = ref<CategoryErrorKey | "">("");
  const busy = ref(false);

  /** The last remaining category can't be deleted (expenses always need somewhere to live). */
  const canDelete = computed(() => categoriesStore.all.length > 1);

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
  function startEdit(category: Category) {
    editing.value = category;
    error.value = "";
    view.value = "form";
  }
  function backToList() {
    error.value = "";
    view.value = "list";
  }

  /** Run a server change; on success go back to the list, otherwise stay on the form with a message. */
  async function run(action: () => Promise<void>) {
    if (busy.value) return;
    busy.value = true;
    error.value = "";
    try {
      await action();
      backToList();
    } catch (e) {
      const err = e as { data?: { message?: string } };
      error.value = err.data?.message === "category_limit" ? "category_limit" : "save_failed";
    } finally {
      busy.value = false;
    }
  }

  const save = (draft: CategoryDraft) =>
    run(() => (editing.value ? categoriesStore.update(editing.value, draft) : categoriesStore.add(draft)));

  const remove = () =>
    run(async () => {
      if (editing.value) await categoriesStore.remove(editing.value);
    });

  return { isOpen, view, editing, error, busy, canDelete, open, close, startAdd, startEdit, backToList, save, remove };
});
