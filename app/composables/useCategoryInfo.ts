/** Language-aware display info for a category key (built-in keys are named by i18n, custom ones by the person). */
export function useCategoryInfo() {
  const { t } = useI18n();
  const categoriesStore = useCategoriesStore();

  /** `{ label, color, icon }` for the key stored on an expense; unknown keys show as "Other". */
  function info(key: string) {
    const c = categoriesStore.byKey(key);
    return {
      key: c.key,
      label: c.builtin ? t(`categories.${c.key}`) : (c.name ?? ""),
      color: c.color,
      icon: c.icon,
    };
  }

  return { info };
}
