<template>
  <section class="total rise" :aria-label="t('total_expenses')">
    <div class="total-label">{{ t("total_expenses") }}</div>
    <div class="total-amount">
      <span>{{ formatNumber(shown) }}</span
      ><small>{{ t("currency") }}</small>
    </div>
    <!-- Money set aside in category budgets: what's left after this month's expenses -->
    <div v-if="budgetSummary.any" class="total-budget" :class="{ over: budgetSummary.left < 0 }">
      <span>{{ budgetSummary.left < 0 ? t("budget_over_label") : t("budget_left_label") }}</span>
      <b>{{ formatNumber(Math.abs(budgetSummary.left)) }} {{ t("currency") }}</b>
      <small>{{ t("budget_of", { total: formatNumber(budgetSummary.total) }) }}</small>
    </div>
  </section>
</template>

<script lang="ts" setup>
const { t } = useI18n();

const { total } = storeToRefs(useExpensesStore());
const { budgetSummary } = storeToRefs(useCategoriesStore());

// Count up 0 -> total in 800ms (ease-out); skipped for reduced motion.
const shown = ref(total.value);
let raf = 0;

function animate(to: number) {
  cancelAnimationFrame(raf);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    shown.value = to;
    return;
  }
  const t0 = performance.now();
  const tick = (t: number) => {
    const p = Math.min(1, (t - t0) / 800);
    shown.value = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}

onMounted(() => animate(total.value));

watch(total, animate);

onBeforeUnmount(() => cancelAnimationFrame(raf));
</script>