<template>
  <header class="header">
    <div class="header-row">
      <h1>{{ t("app_title") }}</h1>
      <!-- phones & tablets: icon links; desktop uses the sidebar + the "actions" slot -->
      <div class="header-actions">
        <VIconButton icon="compare" :label="t('compare')" to="/compare" />
        <VIconButton icon="settings" :label="t('settings')" to="/settings" />
      </div>
      <slot name="actions" />
    </div>
    <slot />
  </header>
</template>

<script lang="ts" setup>
const { t } = useI18n();
</script>