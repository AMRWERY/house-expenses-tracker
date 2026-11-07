<template>
  <div class="filter-row" role="radiogroup" :aria-label="t('filter_by_category')">
    <button type="button" role="radio" class="chip" :aria-checked="filterCat === null" @click="expensesStore.setFilter(null)">
      {{ t("all_categories") }}
    </button>
    <button
      v-for="c in categories.all"
      :key="c.key"
      type="button"
      role="radio"
      class="chip"
      :aria-checked="filterCat === c.key"
      @click="expensesStore.setFilter(c.key)"
    >
      <AppIcon :name="c.icon" />
      {{ info(c.key).label }}
    </button>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();

const expensesStore = useExpensesStore();
const { filterCat } = storeToRefs(expensesStore);
const categories = useCategoriesStore();
const { info } = useCategoryInfo();
</script>
