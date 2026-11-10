import type { Category, CategoryDraft, CategoryErrorKey } from "~/types/stores/categoriesStore";

/** The "Categories" bottom sheet on the home page: the list, and the add/edit/delete form inside it. */
export const useCategorySheetStore = defineStore("categorySheet", () => {
  const categoriesStore = useCategoriesStore();
  const toastStore = useToastStore();
  const nuxtApp = useNuxtApp(); // captured here: composables are not available after an await

  const isOpen = ref(false);
  const view = ref<"list" | "form">("list");
  /** the category being edited; null while adding a new one */
  const editing = ref<Category | null>(null);
  const error = ref<CategoryErrorKey | "">("");
  const busy = ref(false);
  /** The change in flight: the list shows a skeleton for that category (a new one at the end for "add"). */
  const pending = ref<{ kind: "add" | "update" | "delete"; id?: string } | null>(null);

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

  /**
   * Run a server change. The list shows right away with a skeleton row for the category being added,
   * updated or deleted (held at least 1 second), then the whole dialog closes. A failure brings the form back,
   * with its input, and a message.
   */
  async function run(kind: "add" | "update" | "delete", action: () => Promise<void>) {
    if (busy.value) return;
    busy.value = true;
    error.value = "";
    pending.value = { kind, id: editing.value?.id };
    view.value = "list";
    try {
      await atLeastSkeletonTime(action());
      close(); // done: the whole dialog closes, not just the form
      toastStore.show({ text: nuxtApp.$i18n.t(`category_${kind === "add" ? "added" : kind === "update" ? "updated" : "deleted"}`) });
    } catch (e) {
      const err = e as { data?: { message?: string } };
      error.value = err.data?.message === "category_limit" ? "category_limit" : "save_failed";
      view.value = "form";
    } finally {
      busy.value = false;
      pending.value = null;
    }
  }

  const save = (draft: CategoryDraft) =>
    run(editing.value ? "update" : "add", () =>
      editing.value ? categoriesStore.update(editing.value, draft) : categoriesStore.add(draft),
    );

  const remove = () =>
    run("delete", async () => {
      if (editing.value) await categoriesStore.remove(editing.value);
    });

  return { isOpen, view, editing, error, busy, pending, open, close, startAdd, startEdit, backToList, save, remove };
});
