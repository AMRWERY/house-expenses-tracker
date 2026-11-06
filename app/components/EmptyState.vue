<template>
  <div class="empty rise">
    <div class="empty-ico"><AppIcon name="wallet" /></div>
    <p>{{ t("no_expenses") }}</p>
    <button class="btn" @click="$emit('add')">{{ t("add_expense") }}</button>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();

defineEmits<{ add: [] }>();
</script>