<template>
  <div
    class="row"
    role="button"
    tabindex="0"
    :style="{ '--c': CATEGORY_COLORS[expense.cat] }"
    @click="sheetStore.openEdit(expense)"
    @keydown.enter="sheetStore.openEdit(expense)"
  >
    <span class="row-icon"><AppIcon :name="expense.cat" /></span>
    <div class="row-text">
      <div class="row-title">{{ title }}</div>
      <div class="row-cat">{{ t(`categories.${expense.cat}`) }}</div>
    </div>
    <div
      class="row-amount"
      :aria-label="t('expense_aria', { amount: formatNumber(expense.amount) })"
    >
      −{{ formatNumber(expense.amount) }} {{ t("currency") }}
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();
const sheetStore = useSheetStore();

const props = defineProps<{ expense: Expense }>();

const title = computed(() =>
  props.expense.titleKey
    ? t(props.expense.titleKey)
    : props.expense.note || t(`categories.${props.expense.cat}`),
);
</script>