<template>
  <div
    class="row"
    role="button"
    tabindex="0"
    :style="{ '--c': category.color }"
    @click="sheetStore.openEdit(expense)"
    @keydown.enter="sheetStore.openEdit(expense)"
  >
    <span v-if="number !== undefined" class="row-num" aria-hidden="true">{{
      number
    }}</span>
    <span class="row-icon"><app-icon :name="category.icon" /></span>
    <div class="row-text">
      <div class="row-title">
        {{ title }}<app-icon v-if="expense.hasReceipt" name="paperclip" class="row-clip" :aria-label="t('receipt')" />
      </div>
      <div class="row-cat">{{ subline }}</div>
    </div>
    <div class="row-end">
      <div
        class="row-amount"
        :aria-label="
          t('expense_aria', { amount: formatNumber(expense.amount) })
        "
      >
        −<animated-number :value="expense.amount" /> {{ t("currency") }}
      </div>
      <!-- The category's main amount (its monthly budget) -->
      <div v-if="budget" class="row-budget" dir="ltr">
        <animated-number :value="budget.budget" /> {{ t("currency") }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();
const sheetStore = useSheetStore();
const { info } = useCategoryInfo();

const props = defineProps<{
  expense: Expense;
  subtitle?: string;
  number?: number;
}>();

const category = computed(() => info(props.expense.cat));

// The category's monthly budget (absent when it has none).
const { budgets } = storeToRefs(useCategoriesStore());
const budget = computed(() => budgets.value.get(category.value.key));

// Second line: the day (or category), then the merchant and how it was paid, when given.
const subline = computed(() =>
  [
    props.subtitle ?? category.value.label,
    props.expense.merchant,
    props.expense.paymentMethod ? t(`pay_${props.expense.paymentMethod}`) : undefined,
  ]
    .filter(Boolean)
    .join(" · "),
);

const title = computed(() =>
  props.expense.titleKey
    ? t(props.expense.titleKey)
    : props.expense.note || category.value.label,
);
</script>

<style scoped>
.row-clip {
  width: 14px;
  height: 14px;
  margin-inline-start: 6px;
  vertical-align: -2px;
  color: var(--text-2);
}
.row-num {
  min-width: 22px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
  text-align: center;
}
</style>