<template>
  <header class="header">
    <div class="header-row">
      <h1>{{ t("app_title") }}</h1>
      <!-- phones & tablets: icon links; desktop uses the sidebar + the "actions" slot -->
      <div class="header-actions">
        <nuxt-link-locale
          class="icon-btn"
          to="/compare"
          :aria-label="t('compare')"
        >
          <AppIcon name="compare" />
        </nuxt-link-locale>
        <nuxt-link-locale
          class="icon-btn"
          to="/settings"
          :aria-label="t('settings')"
        >
          <AppIcon name="settings" />
        </nuxt-link-locale>
      </div>
      <slot name="actions" />
    </div>
    <slot />
  </header>
</template>

<script lang="ts" setup>
const { t } = useI18n();
</script>