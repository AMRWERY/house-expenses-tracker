<template>
  <VStatCard class="rise" :label="label" :value="total">
    <!-- Money set aside in category budgets: what's left after this month's expenses -->
    <!-- Once the month has a main amount, the card above it shows the budget lines instead -->
    <div
      v-if="budgetSummary.any && amount === null"
      class="total-budget"
      :class="{ over: budgetSummary.left < 0 }"
    >
      <span>{{
        budgetSummary.left < 0 ? t("budget_over_label") : t("budget_left_label")
      }}</span>
      <b
        ><animated-number :value="Math.abs(budgetSummary.left)" />
        {{ t("currency") }}</b
      >
      <small>{{
        t("budget_of", { total: formatNumber(budgetSummary.total) })
      }}</small>
    </div>
  </VStatCard>
</template>

<script lang="ts" setup>
const { t } = useI18n();

const { total, range } = storeToRefs(useExpensesStore());
const { isoLabel } = useDateLabels();

// With a date range picked the card says which dates it adds up
const label = computed(() =>
  range.value
    ? t("range_total", { from: isoLabel(range.value.from), to: isoLabel(range.value.to) })
    : t("total_expenses"),
);
const { budgetSummary } = storeToRefs(useCategoriesStore());
const { amount } = storeToRefs(useMonthAmountStore());
</script>