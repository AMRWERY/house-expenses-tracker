<template>
  <div class="sheet-root">
    <div class="backdrop" @click="sheet.close()" />

    <div class="sheet" role="dialog" aria-modal="true" :aria-label="heading">
      <div class="grab" aria-hidden="true" />

      <div class="sheet-head">
        <div class="sheet-title">
          <button
            v-if="view === 'form'"
            class="icon-btn"
            type="button"
            :aria-label="t('back')"
            @click="sheet.backToList()"
          >
            <AppIcon :name="backIcon" />
          </button>
          <h2>{{ heading }}</h2>
        </div>
        <button class="icon-btn" type="button" :aria-label="t('close')" @click="sheet.close()">
          <AppIcon name="x" />
        </button>
      </div>

      <!-- List: built-in categories (fixed) then the person's own (editable) -->
      <template v-if="view === 'list'">
        <ul class="cat-list">
          <li v-for="c in categories.all" :key="c.key" class="cat-item">
            <span class="row-icon" :style="{ '--c': c.color }"><AppIcon :name="c.icon" /></span>
            <div class="row-text">
              <div class="row-title">{{ info(c.key).label }}</div>
              <!-- Budget left this month (or how far over) -->
              <div v-if="categories.budgets.get(c.key)" class="row-cat" :class="{ 'is-over': categories.budgets.get(c.key)!.left < 0 }">
                {{ budgetText(categories.budgets.get(c.key)!) }}
              </div>
            </div>
            <button
              class="icon-btn"
              type="button"
              :aria-label="`${t('edit_category')}: ${info(c.key).label}`"
              @click="sheet.startEdit(c)"
            >
              <AppIcon name="pencil" />
            </button>
          </li>
        </ul>

        <button class="btn btn-block" type="button" @click="sheet.startAdd()">
          <AppIcon name="plus" />{{ t("add_category") }}
        </button>
      </template>

      <CategoryForm v-else :key="editing?.id ?? 'new'" />
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t, locale } = useI18n();

const sheet = useCategorySheetStore();
const { view, editing } = storeToRefs(sheet);
const categories = useCategoriesStore();
const { info } = useCategoryInfo();

const heading = computed(() =>
  view.value === "list" ? t("categories_title") : editing.value ? t("edit_category") : t("add_category"),
);

// "350 EGP left of 1,000" / "Over by 120 EGP"
const budgetText = (b: { budget: number; left: number }) =>
  b.left < 0
    ? t("budget_over", { amount: `${formatNumber(-b.left)} ${t("currency")}` })
    : t("budget_left", { amount: `${formatNumber(b.left)} ${t("currency")}`, total: formatNumber(b.budget) });

// "Back" points toward the inline-start edge, which flips with the language.
const backIcon = computed<IconName>(() => (locale.value === "ar" ? "arrowRight" : "arrowLeft"));

// Esc closes; body doesn't scroll behind the sheet.
const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && sheet.close();

onMounted(() => {
  window.addEventListener("keydown", onKey);
  document.body.style.overflow = "hidden";
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  document.body.style.overflow = "";
});
</script>
