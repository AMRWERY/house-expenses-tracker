<template>
  <section class="total" :aria-label="label">
    <div class="total-label">{{ label }}</div>
    <div class="total-amount">
      <animated-number :value="value" :duration="800" /><small>{{ t("currency") }}</small>
    </div>
    <slot />
  </section>
</template>

<script lang="ts" setup>
const { t } = useI18n();

/** The big centered "label / number EGP" card. Extra content (budget bar, stats) goes in the default slot. */
defineProps<{ label: string; value: number }>();
</script>
