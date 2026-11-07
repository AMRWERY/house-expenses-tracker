import type { Category, CategoryDraft, CustomCategory } from "~/types/stores/categoriesStore";
import { ICONS, type IconName } from "~/utils/icons";

/** What the server sends for a custom category (the icon is a plain string there). */
type CategoryRecord = Omit<CustomCategory, "icon"> & { icon: string };

const toCustom = (r: CategoryRecord): CustomCategory => ({
  ...r,
  icon: (r.icon in ICONS ? r.icon : "tag") as IconName,
});

/**
 * Every category an expense can use: the 7 built-in ones (fixed, named by i18n) plus the custom ones
 * the person adds, edits and deletes. Deleting a custom category moves its expenses to "other".
 * Names shown on screen come from useCategoryInfo(), which knows the language.
 */
export const useCategoriesStore = defineStore("categories", () => {
  const expensesStore = useExpensesStore();
  const demo = isDemo(useRouter().currentRoute.value.query); // preview: local only, nothing is saved

  // ---- State
  const custom = ref<CustomCategory[]>([]);
  const loaded = ref(false);

  // ---- Getters
  const all = computed<Category[]>(() => [
    ...CATEGORY_KEYS.map((key) => ({
      key,
      builtin: true,
      color: CATEGORY_COLORS[key],
      icon: key as IconName,
    })),
    ...custom.value.map((c) => ({ key: c.id, builtin: false, name: c.name, color: c.color, icon: c.icon })),
  ]);

  /** A category by the key stored on an expense; unknown (e.g. just deleted) falls back to "other". */
  function byKey(key: string): Category {
    return all.value.find((c) => c.key === key) ?? all.value.find((c) => c.key === "other")!;
  }

  // ---- Actions
  /** Load the signed-in user's custom categories from the server (once per session). */
  async function load() {
    if (loaded.value || demo) return;
    const fetcher = useRequestFetch(); // forwards the session cookie during SSR
    custom.value = (await fetcher<CategoryRecord[]>("/api/categories")).map(toCustom);
    loaded.value = true;
  }

  /** Forget the previous user's data (on sign-out). */
  function reset() {
    custom.value = [];
    loaded.value = false;
  }

  /** Saved on the server first; the list only changes once the server accepts it (throws otherwise). */
  async function add(draft: CategoryDraft) {
    const record = demo
      ? { id: `demo-${Date.now()}`, ...draft }
      : await $fetch<CategoryRecord>("/api/categories", { method: "POST", body: draft });
    custom.value = [...custom.value, toCustom(record)];
  }

  async function update(id: string, draft: CategoryDraft) {
    const record = demo ? { id, ...draft } : await $fetch<CategoryRecord>(`/api/categories/${id}`, { method: "PUT", body: draft });
    custom.value = custom.value.map((c) => (c.id === id ? toCustom(record) : c));
  }

  async function remove(id: string) {
    if (!demo) await $fetch(`/api/categories/${id}`, { method: "DELETE" });
    custom.value = custom.value.filter((c) => c.id !== id);
    expensesStore.reassignCategory(id, "other");
  }

  return { custom, loaded, all, byKey, load, reset, add, update, remove };
});
