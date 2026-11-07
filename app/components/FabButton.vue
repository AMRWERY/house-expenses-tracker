<template>
  <button class="fab" :aria-label="t('add_expense')" @click="sheetStore.openAdd()">
    <AppIcon name="plus" />
  </button>
</template>

<script lang="ts" setup>
const { t } = useI18n();
const sheetStore = useSheetStore();
</script>
