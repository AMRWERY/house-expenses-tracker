<script lang="ts" setup>
definePageMeta({ layout: 'blank' })

const { t, locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
useTheme()

const { isSupported, busy, error, signIn, signUp } = useAuthFlow()

type Mode = 'signin' | 'signup'
const mode = ref<Mode>(useRoute().query.mode === 'signup' ? 'signup' : 'signin')
const name = ref('')

const modes = computed<{ value: Mode; label: string }[]>(() => [
  { value: 'signin', label: t('signin') },
  { value: 'signup', label: t('signup') },
])

const otherLocale = computed(() => (locale.value === 'ar' ? 'en' : 'ar'))

function submit() {
  if (mode.value === 'signin') signIn()
  else signUp(name.value)
}
</script>

<template>
  <div class="auth-page">
    <nuxt-link class="auth-lang" :to="switchLocalePath(otherLocale)" :hreflang="otherLocale">
      {{ otherLocale === 'ar' ? 'عربي' : 'English' }}
    </nuxt-link>

    <div class="lock-card">
      <div class="lock-ico"><AppIcon name="fingerprint" /></div>
      <h1>{{ t('app_title') }}</h1>
      <p class="lock-hint">{{ mode === 'signin' ? t('signin_hint') : t('signup_hint') }}</p>

      <SegmentedControl v-model="mode" :options="modes" :label="t('app_title')" />

      <form class="auth-form" novalidate @submit.prevent="submit">
        <template v-if="mode === 'signup'">
          <label class="field-label" for="name">{{ t('name_label') }}</label>
          <input
            id="name"
            v-model="name"
            class="field field-input"
            type="text"
            maxlength="40"
            autocomplete="username"
            :placeholder="t('name_placeholder')"
          />
        </template>

        <button class="btn lock-btn" type="submit" :disabled="busy || !isSupported || (mode === 'signup' && name.trim().length < 2)">
          <AppIcon name="fingerprint" />{{ mode === 'signin' ? t('signin_btn') : t('signup_btn') }}
        </button>

        <p v-if="!isSupported" class="field-error">{{ t('auth_unsupported') }}</p>
        <p v-else-if="error" class="field-error" role="alert">{{ error }}</p>
      </form>
    </div>
  </div>
</template>
