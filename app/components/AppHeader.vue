<template>
  <header class="header">
    <div class="header-row">
      <h1>{{ t("app_title") }}</h1>
      <!-- phones & tablets: icon links; desktop uses the sidebar + the "actions" slot -->
      <div class="header-actions">
        <nuxt-link-locale
          class="icon-btn"
          :to="localePath('/compare')"
          :aria-label="t('compare')"
        >
          <AppIcon name="compare" />
        </nuxt-link-locale>
        <nuxt-link-locale
          class="icon-btn"
          :to="localePath('/settings')"
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

const localePath = useLocalePath();
</script>
