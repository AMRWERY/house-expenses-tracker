/** Language-aware display info for a category key: the person's own name, else the translated default name. */
export function useCategoryInfo() {
  const { t } = useI18n();
  const categoriesStore = useCategoriesStore();

  function labelOf(c: { name?: string; defaultKey?: string }) {
    return c.name ?? (c.defaultKey ? t(`categories.${c.defaultKey}`) : "");
  }

  /** `{ label, color, icon }` for the key stored on an expense; unknown keys show as "Other". */
  function info(key: string) {
    const c = categoriesStore.byKey(key);
    return { key: c.key, label: labelOf(c), color: c.color, icon: c.icon };
  }

  return { info, labelOf };
}
