<template>
  <div
    class="row"
    role="button"
    tabindex="0"
    :style="{ '--c': category.color }"
    @click="sheetStore.openEdit(expense)"
    @keydown.enter="sheetStore.openEdit(expense)"
  >
    <span class="row-icon"><AppIcon :name="category.icon" /></span>
    <div class="row-text">
      <div class="row-title">{{ title }}</div>
      <div class="row-cat">{{ category.label }}</div>
    </div>
    <div class="row-end">
      <div
        class="row-amount"
        :aria-label="t('expense_aria', { amount: formatNumber(expense.amount) })"
      >
        −<AnimatedNumber :value="expense.amount" /> {{ t("currency") }}
      </div>
      <!-- The category's main amount (its monthly budget) -->
      <div v-if="budget" class="row-budget" dir="ltr"><AnimatedNumber :value="budget.budget" /> {{ t("currency") }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();
const sheetStore = useSheetStore();
const { info } = useCategoryInfo();

const props = defineProps<{ expense: Expense }>();

const category = computed(() => info(props.expense.cat));

// The category's monthly budget (absent when it has none).
const { budgets } = storeToRefs(useCategoriesStore());
const budget = computed(() => budgets.value.get(category.value.key));

const title = computed(() =>
  props.expense.titleKey
    ? t(props.expense.titleKey)
    : props.expense.note || category.value.label,
);
</script>