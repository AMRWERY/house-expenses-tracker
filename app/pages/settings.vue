<script lang="ts" setup>
const { t, locale, setLocale } = useI18n()
const localePath = useLocalePath()
const theme = useTheme()

const themeOptions = computed<{ value: ThemeMode; label: string }[]>(() => [
  { value: 'light', label: t('theme_light') },
  { value: 'dark', label: t('theme_dark') },
  { value: 'system', label: t('theme_system') },
])

// Language names are always shown in their own language.
const langOptions = [
  { value: 'ar', label: 'عربي' },
  { value: 'en', label: 'English' },
] as const

// Account: shown when signed in (not in the dev-only preview).
const { user, clear } = useUserSession()
async function logout() {
  await clear()
  resetExpenses() // never leave one person's data in memory for the next
  await navigateTo(localePath('/login'))
}

const passkeys = usePasskeys()
const dateLocale = computed(() => (locale.value === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US'))

// "Back" points toward the inline-start edge, which flips with the language.
const backIcon = computed<IconName>(() => (locale.value === 'ar' ? 'arrowRight' : 'arrowLeft'))
</script>

<template>
  <div class="app narrow">
    <header class="page-head">
      <nuxt-link-locale class="icon-btn" to="/" :aria-label="t('back')">
        <AppIcon :name="backIcon" />
      </nuxt-link-locale>
      <h1>{{ t('settings') }}</h1>
    </header>

    <main>
      <section class="setting rise" style="--i: 0">
        <h2>{{ t('appearance') }}</h2>
        <div class="setting-card">
          <SegmentedControl v-model="theme" :options="themeOptions" :label="t('appearance')" />
        </div>
      </section>

      <section class="setting rise" style="--i: 1">
        <h2>{{ t('language') }}</h2>
        <div class="setting-card">
          <SegmentedControl
            :model-value="locale"
            :options="[...langOptions]"
            :label="t('language')"
            @update:model-value="setLocale($event as 'ar' | 'en')"
          />
        </div>
      </section>

      <section v-if="user" class="setting rise" style="--i: 2">
        <h2>{{ t('account') }}</h2>
        <div class="setting-card">
          <div class="setting-row account-row">
            <span class="row-icon" style="--c: #10b981"><AppIcon name="user" /></span>
            <div class="row-text">
              <div class="row-title row-email" dir="ltr">{{ user.email }}</div>
              <div class="row-cat">{{ t('signed_in') }}</div>
            </div>
          </div>
          <button class="btn-text danger" type="button" @click="logout">{{ t('logout') }}</button>
        </div>
      </section>

      <!-- Desktop only: link this account to a phone's fingerprint / Face ID (QR code). -->
      <section v-if="user" class="setting rise only-desktop" style="--i: 3">
        <h2>{{ t('link_phone_title') }}</h2>
        <div class="setting-card">
          <p class="setting-desc">{{ t('link_phone_desc') }}</p>
          <button class="btn btn-block" type="button" :disabled="passkeys.busy.value || !passkeys.isSupported.value" @click="passkeys.link()">
            <AppIcon name="fingerprint" />{{ t('link_phone_btn') }}
          </button>

          <p v-if="passkeys.notice.value" class="auth-notice" role="status">{{ passkeys.notice.value }}</p>
          <p v-if="passkeys.error.value" class="field-error sheet-error" role="alert">{{ passkeys.error.value }}</p>

          <template v-if="passkeys.devices.value.length">
            <h3 class="device-title">{{ t('linked_devices') }}</h3>
            <ul class="device-list">
              <li v-for="d in passkeys.devices.value" :key="d.id" class="device-row">
                <span class="row-icon" style="--c: #10b981"><AppIcon name="fingerprint" /></span>
                <div class="row-text">
                  <div class="row-title">{{ t('linked_phone') }}</div>
                  <div class="row-cat">{{ new Date(d.createdAt).toLocaleDateString(dateLocale) }}</div>
                </div>
                <button class="btn-text danger device-remove" type="button" @click="passkeys.unlink(d.id)">{{ t('unlink') }}</button>
              </li>
            </ul>
          </template>
        </div>
      </section>
    </main>
  </div>
</template>
