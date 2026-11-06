<template>
  <button class="fab" :aria-label="t('add_expense')">
    <AppIcon name="plus" />
  </button>
</template>

<script lang="ts" setup>
const { t } = useI18n();
</script>