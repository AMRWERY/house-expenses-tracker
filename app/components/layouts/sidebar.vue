<template>
  <aside class="sidebar">
    <div class="brand">
      <span class="brand-ico"><app-icon name="wallet" /></span>
      <span>{{ t("app_title") }}</span>
    </div>

    <nav class="nav" :aria-label="t('app_title')">
      <nuxt-link-locale class="nav-link" exact-active-class="active" to="/">
        <app-icon name="home" />{{ t("nav_home") }}
      </nuxt-link-locale>
      <nuxt-link-locale
        class="nav-link"
        exact-active-class="active"
        to="/compare"
      >
        <app-icon name="compare" />{{ t("compare") }}
      </nuxt-link-locale>
    </nav>

    <nav class="nav nav-bottom">
      <nuxt-link-locale class="nav-link nav-profile" to="/settings">
        <user-avatar :size="32" />
        <span class="nav-profile-name">{{ user?.name || user?.email }}</span>
      </nuxt-link-locale>
      <nuxt-link-locale
        class="nav-link"
        exact-active-class="active"
        to="/settings"
      >
        <app-icon name="settings" />{{ t("settings") }}
      </nuxt-link-locale>
    </nav>
  </aside>
</template>

<script lang="ts" setup>
const { t } = useI18n();
const { user } = storeToRefs(useAuthStore());
</script>