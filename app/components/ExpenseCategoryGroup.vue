<template>
  <section class="day cat-group rise" :class="{ 'is-collapsed': collapsed }" :style="{ '--i': index, '--c': category.color }">
    <!-- Sticky header: tap to collapse the category down to its total -->
    <h2 class="day-title cat-title">
      <button
        type="button"
        class="cat-toggle"
        :aria-expanded="!collapsed"
        :aria-label="t(collapsed ? 'expand_category' : 'collapse_category', { name: category.label })"
        @click="collapsed = !collapsed"
      >
        <AppIcon :name="category.icon" />
        <span class="cat-name">{{ category.label }}</span>
        <span v-if="share !== null" class="cat-share">{{ t("share_of_total", { p: share }) }}</span>
        <AppIcon name="chevronDown" class="cat-chevron" />
      </button>
    </h2>

    <!-- What's been spent in this category this month -->
    <div class="total cat-total" :aria-label="t('total_expenses')">
      <div class="total-label">{{ t("total_expenses") }}</div>
      <div class="total-amount">
        <AnimatedNumber :value="total" :duration="800" /><small>{{ t("currency") }}</small>
      </div>

      <!-- Budget progress: fills from the start, turns amber near the limit and red when over -->
      <div v-if="budget" class="cat-budget" :class="budgetState">
        <div
          class="cat-bar"
          role="progressbar"
          :aria-valuenow="Math.min(budgetPct, 100)"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div class="cat-fill" :style="{ width: Math.min(budgetPct, 100) + '%' }" />
        </div>
        <div class="cat-budget-text">
          <span>{{ budget.left < 0 ? t("budget_over_label") : t("budget_left_label") }}</span>
          <b><AnimatedNumber :value="Math.abs(budget.left)" /> {{ t("currency") }}</b>
          <small>{{ t("budget_of", { total: formatNumber(budget.budget) }) }}</small>
        </div>
      </div>
    </div>

    <!-- grid-rows 0fr -> 1fr lets the height animate without measuring -->
    <div class="cat-body" :class="{ 'is-open': !collapsed }" :inert="collapsed">
      <div class="cat-body-inner">
        <TransitionGroup name="xrow" tag="div" class="rows">
          <template v-for="(e, i) in pageItems">
            <!-- the expense being updated or deleted: only this one is a skeleton -->
            <ExpenseRowSkeleton v-if="e.id === busyId" :key="e.id" />
            <ExpenseRow v-else :key="e.id" :expense="e" :subtitle="dayLabel(e.day)" :number="(current - 1) * PAGE_SIZE + i + 1" />
          </template>
          <!-- the expense being added: only this one is a skeleton -->
          <ExpenseRowSkeleton v-if="pending" key="pending" />
        </TransitionGroup>

        <!-- Only when the category has more than one page of expenses -->
        <nav v-if="pageCount > 1" class="pager" :aria-label="t('page_of', { page: current, pages: pageCount })">
          <button type="button" class="pager-btn" :disabled="current === 1" :aria-label="t('prev_page')" @click="page = current - 1">
            <AppIcon :name="prevIcon" />
          </button>
          <span class="pager-info" aria-live="polite">{{ t("page_of", { page: current, pages: pageCount }) }}</span>
          <button type="button" class="pager-btn" :disabled="current === pageCount" :aria-label="t('next_page')" @click="page = current + 1">
            <AppIcon :name="nextIcon" />
          </button>
        </nav>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import type { Expense } from "~/types/utils";

const PAGE_SIZE = 8;
/** from this share of the budget on, the bar turns amber */
const WARN_AT = 80;

const props = defineProps<{
  cat: string;
  items: Expense[];
  total: number;
  /** whole percent of the month's spending, or null when there is only one category to compare */
  share: number | null;
  index: number;
  pending?: boolean;
}>();

const { t, locale } = useI18n();
const { busyId } = storeToRefs(useExpensesStore());
const { budgets } = storeToRefs(useCategoriesStore());
const { info } = useCategoryInfo();
const { dayLabel } = useDateLabels();

const category = computed(() => info(props.cat));

const collapsed = ref(false);

// The category's monthly budget status (absent when it has no budget).
const budget = computed(() => budgets.value.get(props.cat));
const budgetPct = computed(() => (budget.value && budget.value.budget > 0 ? (budget.value.spent / budget.value.budget) * 100 : 0));
const budgetState = computed(() => (budgetPct.value > 100 ? "is-over" : budgetPct.value >= WARN_AT ? "is-warn" : ""));

// Each category pages on its own; deleting rows can leave the page past the end, so it is clamped.
const page = ref(1);
const pageCount = computed(() => Math.max(1, Math.ceil(props.items.length / PAGE_SIZE)));
const current = computed(() => Math.min(page.value, pageCount.value));
const pageItems = computed(() => props.items.slice((current.value - 1) * PAGE_SIZE, current.value * PAGE_SIZE));

// "Previous" sits at the inline-start edge, so the chevron direction flips with the locale.
const prevIcon = computed(() => (locale.value === "ar" ? "chevronRight" : "chevronLeft"));
const nextIcon = computed(() => (locale.value === "ar" ? "chevronLeft" : "chevronRight"));
</script>

<style scoped>
/* Sticky while its category scrolls past; the background hides rows passing underneath */
.cat-title {
  position: sticky;
  inset-block-start: 0;
  z-index: 5;
  margin: 0 0 8px;
  padding: 8px 4px;
  background: var(--bg);
  transition: background-color 0.3s;
}
.cat-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 36px;
  color: var(--text);
  font: inherit;
  text-align: start;
  border-radius: 12px;
  transition: transform 0.1s;
}
.cat-toggle:active {
  transform: scale(0.99);
}
.cat-toggle:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
.cat-toggle :deep(.ico) {
  flex: none;
  color: var(--c);
}
.cat-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cat-share {
  flex: none;
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--surface-alt);
  color: var(--text-2);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.cat-toggle .cat-chevron {
  color: var(--text-2);
  transition: transform 0.25s ease-out;
}
.is-collapsed .cat-chevron {
  transform: rotate(-90deg);
}
:root[dir="rtl"] .is-collapsed .cat-chevron {
  transform: rotate(90deg);
}

.cat-total {
  margin-top: 0;
  margin-bottom: 10px;
  padding: 16px 20px;
}
.cat-total .total-amount {
  font-size: 28px;
  line-height: 38px;
}
.cat-total .total-amount small {
  font-size: 16px;
}

/* Budget progress */
.cat-budget {
  margin-top: 12px;
  --state: var(--primary);
}
.cat-budget.is-warn {
  --state: #f59e0b;
}
.cat-budget.is-over {
  --state: var(--expense);
}
.cat-bar {
  height: 8px;
  border-radius: 999px;
  background: var(--surface-alt);
  overflow: hidden;
}
.cat-fill {
  height: 100%;
  border-radius: inherit;
  background: var(--state);
  transition:
    width 0.7s ease-out,
    background-color 0.3s;
  animation: cat-grow 0.7s ease-out both;
}
@keyframes cat-grow {
  from {
    width: 0;
  }
}
.cat-budget-text {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: baseline;
  gap: 6px;
  margin-top: 8px;
  font-size: 13px;
  color: var(--text-2);
}
.cat-budget-text b {
  color: var(--state);
  font-variant-numeric: tabular-nums;
}

/* Collapse / expand */
.cat-body {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 0.3s ease-out,
    opacity 0.25s ease-out;
}
.cat-body.is-open {
  grid-template-rows: 1fr;
  opacity: 1;
}
.cat-body-inner {
  min-height: 0;
  overflow: hidden;
  /* room for the row shadows and focus rings that overflow:hidden would clip */
  padding: 4px;
  margin: -4px;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 12px;
}
.pager-info {
  font-size: 13px;
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
}
.pager-btn {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--surface-alt);
  color: var(--text);
  transition: background-color 200ms, transform 100ms;
}
@media (hover: hover) {
  .pager-btn:hover:not(:disabled) {
    background: var(--border);
  }
}
.pager-btn:active:not(:disabled) {
  transform: scale(0.97);
}
.pager-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  .cat-fill {
    animation: none;
  }
  .is-collapsed .cat-chevron,
  :root[dir="rtl"] .is-collapsed .cat-chevron {
    transition: none;
  }
}
</style>
