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
const { info } = useCategoryInfo();

const props = defineProps<{ expense: Expense }>();

const category = computed(() => info(props.expense.cat));

const title = computed(() =>
  props.expense.titleKey
    ? t(props.expense.titleKey)
    : props.expense.note || category.value.label,
);
</script>