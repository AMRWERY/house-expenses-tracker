/** Language-aware display info for a category key: the person's own name, else the translated default name. */
export const useCategoryInfo = () => {
  const { t } = useI18n();
  const categoriesStore = useCategoriesStore();

  const labelOf = (c: { name?: string; defaultKey?: string }) => {
    return c.name ?? (c.defaultKey ? t(`categories.${c.defaultKey}`) : "");
  };

  /** `{ label, color, icon }` for the key stored on an expense; unknown keys show as "Other". */
  const info = (key: string) => {
    const c = categoriesStore.byKey(key);
    return { key: c.key, label: labelOf(c), color: c.color, icon: c.icon };
  };

  return { info, labelOf };
};
