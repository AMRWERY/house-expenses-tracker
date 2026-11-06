<template>
  <aside class="sidebar">
    <div class="brand">
      <span class="brand-ico"><AppIcon name="wallet" /></span>
      <span>{{ t("app_title") }}</span>
    </div>

    <nav class="nav" :aria-label="t('app_title')">
      <nuxt-link-locale class="nav-link" exact-active-class="active" to="/">
        <AppIcon name="home" />{{ t("nav_home") }}
      </nuxt-link-locale>
      <nuxt-link-locale class="nav-link" exact-active-class="active" to="/compare">
        <AppIcon name="compare" />{{ t("compare") }}
      </nuxt-link-locale>
    </nav>

    <nav class="nav nav-bottom">
      <nuxt-link-locale class="nav-link" exact-active-class="active" to="/settings">
        <AppIcon name="settings" />{{ t("settings") }}
      </nuxt-link-locale>
    </nav>
  </aside>
</template>

<script lang="ts" setup>
const { t } = useI18n();
</script>
