<script lang="ts" setup>
definePageMeta({ layout: 'blank' })

const { t, locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const auth = useAuthStore()
const { busy, error, notice } = storeToRefs(auth)

type Mode = 'signin' | 'signup'
const mode = ref<Mode>(useRoute().query.mode === 'signup' ? 'signup' : 'signin')
const email = ref('')
const password = ref('')
const emailTouched = ref(false)

const modes = computed<{ value: Mode; label: string }[]>(() => [
  { value: 'signin', label: t('signin') },
  { value: 'signup', label: t('signup') },
])

const emailValid = computed(() => EMAIL_RE.test(email.value.trim()))
const passwordValid = computed(() =>
  mode.value === 'signup' ? password.value.length >= 8 && password.value.length <= 72 : password.value.length > 0,
)
const canSubmit = computed(() => emailValid.value && passwordValid.value && !busy.value)
const showEmailError = computed(() => emailTouched.value && email.value.trim() !== '' && !emailValid.value)

const otherLocale = computed(() => (locale.value === 'ar' ? 'en' : 'ar'))

function submit() {
  if (!canSubmit.value) return
  const e = email.value.trim().toLowerCase()
  if (mode.value === 'signin') auth.signIn(e, password.value)
  else auth.signUp(e, password.value)
}

// Changing tabs clears the old message.
watch(mode, auth.clearMessages)
</script>

<template>
  <div class="auth-page">
    <nuxt-link class="auth-lang" :to="switchLocalePath(otherLocale)" :hreflang="otherLocale">
      {{ otherLocale === 'ar' ? 'عربي' : 'English' }}
    </nuxt-link>

    <div class="lock-card">
      <div>
        <div class="lock-ico"><AppIcon name="user" /></div>
        <h1>{{ t('app_title') }}</h1>
        <p class="lock-hint">{{ mode === 'signin' ? t('signin_pw_hint') : t('signup_pw_hint') }}</p>

        <SegmentedControl v-model="mode" :options="modes" :label="t('app_title')" />

        <form class="auth-form" novalidate @submit.prevent="submit">
          <label class="field-label" for="email">{{ t('email_label') }}</label>
          <input
            id="email"
            v-model="email"
            class="field field-input"
            type="email"
            inputmode="email"
            dir="ltr"
            autocomplete="email"
            maxlength="254"
            placeholder="test@house.com"
            :aria-invalid="showEmailError"
            @blur="emailTouched = true"
          />
          <p v-if="showEmailError" class="field-error field-error-inline">{{ t('invalid_email') }}</p>

          <label class="field-label field-label-gap" for="password">{{ t('password_label') }}</label>
          <PasswordInput
            id="password"
            v-model="password"
            :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'"
            :placeholder="mode === 'signup' ? t('password_hint') : ''"
          />

          <button class="btn lock-btn" type="submit" :disabled="!canSubmit">
            {{ mode === 'signin' ? t('signin_pw_btn') : t('signup_pw_btn') }}
          </button>

          <p v-if="notice" class="auth-notice" role="status">{{ t(notice) }}</p>
          <p v-if="error" class="field-error" role="alert">{{ t(error) }}</p>
        </form>
      </div>

    </div>
  </div>
</template>
