<template>
  <section class="day cat-group rise" :style="{ '--i': index, '--c': category.color }">
    <h2 class="day-title cat-title"><AppIcon :name="category.icon" />{{ category.label }}</h2>

    <!-- What's been spent in this category this month -->
    <div class="total cat-total" :aria-label="t('total_expenses')">
      <div class="total-label">{{ t("total_expenses") }}</div>
      <div class="total-amount">
        <AnimatedNumber :value="total" :duration="800" /><small>{{ t("currency") }}</small>
      </div>
    </div>

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
  </section>
</template>

<script lang="ts" setup>
import type { Expense } from "~/types/utils";

const PAGE_SIZE = 8;

const props = defineProps<{ cat: string; items: Expense[]; total: number; index: number; pending?: boolean }>();

const { t, locale } = useI18n();
const { busyId } = storeToRefs(useExpensesStore());
const { info } = useCategoryInfo();
const { dayLabel } = useDateLabels();

const category = computed(() => info(props.cat));

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
.cat-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
}
.cat-title :deep(.ico) {
  color: var(--c);
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
</style>
