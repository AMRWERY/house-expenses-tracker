<template>
  <div class="month">
    <!-- Hidden (but still taking its space, so the label stays centered) at the first month, November 2026 -->
    <VIconButton
      :class="{ 'is-hidden': !canGoPrev }"
      :icon="prevIcon"
      :label="t('prev_month')"
      :disabled="!canGoPrev"
      :tabindex="canGoPrev ? 0 : -1"
      @click="expensesStore.prevMonth()"
    />
    <span class="month-label" aria-live="polite">{{ monthLabel }}</span>
    <VIconButton :icon="nextIcon" :label="t('next_month')" @click="expensesStore.nextMonth()" />
  </div>
</template>

<script lang="ts" setup>
const { locale, t } = useI18n();
const expensesStore = useExpensesStore();
const { monthLabel } = useDateLabels();
const { canGoPrev } = storeToRefs(expensesStore);

// "Previous" sits at the inline-start edge, so the chevron direction flips with the locale.
const prevIcon = computed<IconName>(() =>
  locale.value === "ar" ? "chevronRight" : "chevronLeft",
);

const nextIcon = computed<IconName>(() =>
  locale.value === "ar" ? "chevronLeft" : "chevronRight",
);
</script>