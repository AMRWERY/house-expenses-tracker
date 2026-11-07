<template>
  <div class="empty rise">
    <div class="empty-ico"><AppIcon name="wallet" /></div>
    <p>{{ t("no_expenses") }}</p>
    <button class="btn" @click="sheetStore.openAdd()">
      {{ t("add_expense") }}
    </button>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();

const sheetStore = useSheetStore();
</script>