<template>
  <div class="month">
    <button
      class="icon-btn"
      :aria-label="t('prev_month')"
      @click="$emit('prev')"
    >
      <AppIcon :name="prevIcon" />
    </button>
    <span class="month-label" aria-live="polite">{{ label }}</span>
    <button
      class="icon-btn"
      :aria-label="t('next_month')"
      @click="$emit('next')"
    >
      <AppIcon :name="nextIcon" />
    </button>
  </div>
</template>

<script lang="ts" setup>
const { locale, t } = useI18n();

defineProps<{ label: string }>();

defineEmits<{ prev: []; next: [] }>();

// "Previous" sits at the inline-start edge, so the chevron direction flips with the locale.
const prevIcon = computed<IconName>(() =>
  locale.value === "ar" ? "chevronRight" : "chevronLeft",
);

const nextIcon = computed<IconName>(() =>
  locale.value === "ar" ? "chevronLeft" : "chevronRight",
);
</script>