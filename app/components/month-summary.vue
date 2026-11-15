<template>
  <section v-if="!loading" class="summ rise" :aria-label="t('summary_title')">
    <h2 class="summ-h">{{ range ? t("summary_period") : t("summary_title") }}</h2>

    <p v-if="!s.expenseCount && !s.incomeTotal" class="summ-empty">{{ t("summary_empty") }}</p>
    <ul v-else class="summ-list">
      <li v-if="s.expenseCount">
        {{ t("summary_expenses", { n: s.expenseCount, total: formatNumber(s.expenseTotal) }, s.expenseCount) }}
      </li>
      <li v-if="s.incomeTotal > 0">{{ t("summary_income", { income: formatNumber(s.incomeTotal) }) }}</li>
      <li v-if="s.incomeTotal > 0" :class="{ over: s.net < 0 }">
        {{ t(s.net < 0 ? "summary_net_negative" : "summary_net", { net: formatNumber(Math.abs(s.net)) }) }}
      </li>
      <li v-if="s.left !== null" :class="{ over: s.left < 0 }">
        {{ t(s.left < 0 ? "summary_over" : "summary_left", { amount: formatNumber(Math.abs(s.left)) }) }}
      </li>
      <li v-if="s.topCat && !range">{{ t("summary_top", { cat: info(s.topCat.cat).label, amount: formatNumber(s.topCat.total) }) }}</li>
      <li v-if="s.deltaState === 'pct' && s.deltaPct !== null && s.deltaPct !== 0">
        {{ t(s.deltaPct > 0 ? "summary_more" : "summary_less", { p: Math.abs(s.deltaPct) }) }}
      </li>
      <li v-else-if="s.deltaState === 'pct'">{{ t("summary_same") }}</li>
      <li v-else-if="s.deltaState === 'new'">{{ t("summary_prev_none") }}</li>
      <li v-if="s.freeDays && s.freeDays.days > 0 && s.expenseCount">
        {{ t("summary_free_days", { n: s.freeDays.days, of: s.freeDays.of }) }}
      </li>
    </ul>
  </section>
</template>

<script lang="ts" setup>
import { monthBounds, summarize } from "~/utils/monthSummary";

const { t } = useI18n();
const expensesStore = useExpensesStore();
const incomeStore = useIncomeStore();
const monthAmountStore = useMonthAmountStore();
const { info } = useCategoryInfo();
const { range, view, loading } = storeToRefs(expensesStore);

// One calendar month, or the picked date range. Not narrowed by the category filter or the search.
const s = computed(() => {
  const r = range.value;
  const { y, m } = view.value;
  const period = r ?? monthBounds(y, m);
  const prev = new Date(y, m - 1, 1);
  const prevMonthTotal = r
    ? null
    : expensesStore.expenses.reduce(
        (sum, e) => (e.y === prev.getFullYear() && e.m === prev.getMonth() ? sum + e.amount : sum),
        0,
      );
  return summarize({
    from: period.from,
    to: period.to,
    today: expensesStore.todayISO,
    expenses: expensesStore.scoped,
    incomeTotal: incomeStore.totalBetween(period.from, period.to),
    prevMonthTotal,
    mainAmount: r ? null : monthAmountStore.amountFor(y, m),
  });
});
</script>

<style scoped>
.summ {
  margin-top: 16px;
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow);
}
.summ-h {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
}
.summ-list {
  display: grid;
  gap: 6px;
  margin: 0;
  padding-inline-start: 18px;
  font-size: 14px;
  line-height: 22px;
  color: var(--text-2);
}
.summ-list .over {
  color: var(--expense);
}
.summ-empty {
  margin: 0;
  font-size: 14px;
  color: var(--text-2);
}
</style>
