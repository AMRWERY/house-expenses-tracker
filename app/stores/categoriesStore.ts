import type { Category, CategoryDraft } from "~/types/stores/categoriesStore";
import { ICONS, type IconName } from "~/utils/icons";
import { rolloverFor } from "~/utils/rollover";

/** What the server sends for a category. */
interface CategoryRecord {
  id: string;
  key: string | null;
  name: string | null;
  color: string;
  icon: string;
  budget: number | null;
}

const toCategory = (r: CategoryRecord): Category => ({
  key: r.key ?? r.id,
  id: r.id,
  ...(r.key ? { defaultKey: r.key } : {}),
  ...(r.name ? { name: r.name } : {}),
  color: r.color,
  icon: (r.icon in ICONS ? r.icon : "tag") as IconName,
  ...(r.budget !== null ? { budget: r.budget } : {}),
});

/** Shown when an expense points at a category that no longer exists. */
const FALLBACK: Category = { key: "other", id: "other", defaultKey: "other", color: CATEGORY_COLORS.other, icon: "other" };

/**
 * The person's categories: the 7 defaults (created for every account) plus their own. All of them can
 * be edited and deleted; deleting one moves its expenses to another category (the server decides which).
 * Names shown on screen come from useCategoryInfo(), which knows the language.
 */
export const useCategoriesStore = defineStore("categories", () => {
  const expensesStore = useExpensesStore();
  const demo = isDemo(useRouter().currentRoute.value.query); // preview: local only, nothing is saved
  const nuxtApp = useNuxtApp(); // captured here: composables are not available after an await

  /** The preview has no server, so it starts with the 7 defaults locally. */
  const demoCategories = (): Category[] => {
    return CATEGORY_KEYS.map((key) => ({
      key,
      id: key,
      defaultKey: key,
      color: CATEGORY_COLORS[key],
      icon: key as IconName,
    }));
  };

  // ---- State
  const all = ref<Category[]>(demo ? demoCategories() : []);
  const loaded = ref(false);

  // ---- Getters
  /** The name to show for a category key (the person's own name, or the translated default). */
  const label = (key: string): string => {
    const c = byKey(key);
    return c.name ?? (c.defaultKey ? nuxtApp.$i18n.t(`categories.${c.defaultKey}`) : c.key);
  };

  /** A category by the key stored on an expense; unknown (e.g. just deleted) falls back to "other". */
  const byKey = (key: string): Category => {
    return all.value.find((c) => c.key === key) ?? all.value.find((c) => c.key === "other") ?? all.value[0] ?? FALLBACK;
  };

  /**
   * Budget status of every category that has a monthly budget, for the month being viewed:
   * `left` = budget − what's been spent in that category (negative = over budget).
   */
  /** What was spent per category and month, so rollover can walk back through months quickly. */
  const spentIndex = computed(() => {
    const index = new Map<string, number>();
    for (const e of expensesStore.expenses) {
      const k = `${e.cat}|${e.y}|${e.m}`;
      index.set(k, (index.get(k) ?? 0) + e.amount);
    }
    return index;
  });

  /**
   * A category's budget for a month: its base budget plus what rolled over from the months before (only when the person turned
   * rollover on). Null when the category has no budget.
   */
  const availableFor = (c: Category, y: number, m: number): { base: number; rollover: number; available: number } | null => {
    if (c.budget === undefined) return null;
    const settings = useSettingsStore();
    const since = settings.rolloverEnabled ? settings.rolloverSince : null;
    if (!since) return { base: c.budget, rollover: 0, available: c.budget };
    const r = rolloverFor({
      base: c.budget,
      spentIn: (yy, mm) => spentIndex.value.get(`${c.key}|${yy}|${mm}`) ?? 0,
      since,
      y,
      m,
    });
    return { base: c.budget, ...r };
  };

  const budgets = computed(() => {
    const spent = new Map<string, number>();
    for (const e of expensesStore.monthItems) spent.set(e.cat, (spent.get(e.cat) ?? 0) + e.amount);

    const { y, m } = expensesStore.view;
    const status = new Map<string, { budget: number; base: number; rollover: number; spent: number; left: number }>();
    for (const c of all.value) {
      const a = availableFor(c, y, m);
      if (!a) continue;
      const s = spent.get(c.key) ?? 0;
      status.set(c.key, { budget: a.available, base: a.base, rollover: a.rollover, spent: s, left: Math.round((a.available - s) * 100) / 100 });
    }
    return status;
  });

  /** All budgets together: what's left of the money set aside this month. */
  const budgetSummary = computed(() => {
    let total = 0;
    let spent = 0;
    for (const b of budgets.value.values()) {
      total += b.budget;
      spent += b.spent;
    }
    return { any: budgets.value.size > 0, total, spent, left: Math.round((total - spent) * 100) / 100 };
  });

  // ---- Actions
  /** Load the signed-in user's categories from the server (once per session). */
  const load = async () => {
    if (loaded.value || demo) return;
    const fetcher = useRequestFetch(); // forwards the session cookie during SSR
    all.value = (await fetcher<CategoryRecord[]>("/api/categories")).map(toCategory);
    loaded.value = true;
  };

  /** Forget the previous user's data (on sign-out). */
  const reset = () => {
    all.value = demo ? demoCategories() : [];
    loaded.value = false;
  };

  /** Saved on the server first; the list only changes once the server accepts it (throws otherwise). */
  const add = async (draft: CategoryDraft) => {
    const record = demo
      ? { id: `demo-${Date.now()}`, key: null, ...draft }
      : await $fetch<CategoryRecord>("/api/categories", { method: "POST", body: draft });
    all.value = [...all.value, toCategory(record)];
  };

  const update = async (category: Category, draft: CategoryDraft) => {
    const record = demo
      ? { id: category.id, key: category.defaultKey ?? null, ...draft }
      : await $fetch<CategoryRecord>(`/api/categories/${category.id}`, { method: "PUT", body: draft });
    all.value = all.value.map((c) => (c.id === category.id ? toCategory(record) : c));
  };

  /**
   * Delete one; its expenses move to another category, mirrored here from what the server did.
   * Deleting the last category is allowed: there is nowhere to move its expenses (`movedTo` is null), so they stay.
   */
  const remove = async (category: Category) => {
    let movedTo: string | null;
    if (demo) {
      const rest = all.value.filter((c) => c.id !== category.id);
      movedTo = (rest.find((c) => c.key === "other") ?? rest[0])?.key ?? null;
    } else {
      movedTo = (await $fetch<{ movedTo: string | null }>(`/api/categories/${category.id}`, { method: "DELETE" })).movedTo;
    }
    all.value = all.value.filter((c) => c.id !== category.id);
    if (movedTo !== null) {
      expensesStore.reassignCategory(category.key, movedTo);
      useRecurringStore().reassignCategory(category.key, movedTo);
    }
  };

  return { all, loaded, budgets, budgetSummary, availableFor, byKey, label, load, reset, add, update, remove };
});
