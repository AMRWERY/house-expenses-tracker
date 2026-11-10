<template>
  <div
    class="filter-row"
    role="radiogroup"
    :aria-label="t('filter_by_category')"
  >
    <VChip :selected="filterCat === null" @click="expensesStore.setFilter(null)">
      {{ t("all_categories") }}
    </VChip>
    <VChip
      v-for="c in categories.all"
      :key="c.key"
      :icon="c.icon"
      :selected="filterCat === c.key"
      @click="expensesStore.setFilter(c.key)"
    >
      {{ info(c.key).label }}
    </VChip>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();

const expensesStore = useExpensesStore();
const { filterCat } = storeToRefs(expensesStore);
const categories = useCategoriesStore();
const { info } = useCategoryInfo();
</script>