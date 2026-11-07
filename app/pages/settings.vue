<script lang="ts" setup>
const { t, locale, setLocale } = useI18n()
const { mode: theme } = storeToRefs(useThemeStore())

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
const auth = useAuthStore()
const { user } = storeToRefs(auth)
const { passwordBusy, passwordError, passwordNotice } = storeToRefs(auth)

// Change password
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const newPasswordValid = computed(() => newPassword.value.length >= 8 && newPassword.value.length <= 72)
const mismatch = computed(() => confirmPassword.value !== '' && confirmPassword.value !== newPassword.value)
const canChangePassword = computed(
  () => currentPassword.value !== '' && newPasswordValid.value && confirmPassword.value === newPassword.value && !passwordBusy.value,
)
async function changePassword() {
  if (!canChangePassword.value) return
  if (await auth.changePassword(currentPassword.value, newPassword.value)) {
    currentPassword.value = newPassword.value = confirmPassword.value = ''
  }
}
onBeforeUnmount(auth.clearPasswordMessages)

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
          <button class="btn-text danger" type="button" @click="auth.logout()">{{ t('logout') }}</button>
        </div>
      </section>

      <section v-if="user" class="setting rise" style="--i: 3">
        <h2>{{ t('change_password') }}</h2>
        <form class="setting-card" novalidate @submit.prevent="changePassword">
          <label class="field-label" for="current-password">{{ t('current_password') }}</label>
          <PasswordInput id="current-password" v-model="currentPassword" autocomplete="current-password" />

          <label class="field-label field-label-gap" for="new-password">{{ t('new_password') }}</label>
          <PasswordInput id="new-password" v-model="newPassword" autocomplete="new-password" :placeholder="t('password_hint')" />

          <label class="field-label field-label-gap" for="confirm-password">{{ t('confirm_password') }}</label>
          <PasswordInput id="confirm-password" v-model="confirmPassword" autocomplete="new-password" />
          <p v-if="mismatch" class="field-error field-error-inline">{{ t('passwords_mismatch') }}</p>

          <button class="btn btn-block" type="submit" :disabled="!canChangePassword">{{ t('update_password') }}</button>

          <p v-if="passwordNotice" class="auth-notice" role="status">{{ t(passwordNotice) }}</p>
          <p v-if="passwordError" class="field-error sheet-error" role="alert">{{ t(passwordError) }}</p>
        </form>
      </section>
    </main>
  </div>
</template>
