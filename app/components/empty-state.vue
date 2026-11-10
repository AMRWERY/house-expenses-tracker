<template>
  <div class="empty rise">
    <div class="empty-ico"><app-icon name="wallet" /></div>
    <p>{{ t("no_expenses") }}</p>
    <VButton @click="sheetStore.openAdd()">
      {{ t("add_expense") }}
    </VButton>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();

const sheetStore = useSheetStore();
</script>