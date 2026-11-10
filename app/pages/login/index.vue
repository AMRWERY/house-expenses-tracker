<script lang="ts" setup>
definePageMeta({ layout: 'blank' })

const { t, locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const auth = useAuthStore()
const { busy, error, notice } = storeToRefs(auth)

type Mode = 'signin' | 'signup'
const mode = ref<Mode>(useRoute().query.mode === 'signup' ? 'signup' : 'signin')
const name = ref('')
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
// Sign-up also asks for a name (1-40 characters): it is what the greeting calls you.
const nameValid = computed(() => name.value.trim().length >= 1 && name.value.trim().length <= 40)
const canSubmit = computed(
  () => emailValid.value && passwordValid.value && (mode.value === 'signin' || nameValid.value) && !busy.value,
)
const showEmailError = computed(() => emailTouched.value && email.value.trim() !== '' && !emailValid.value)

const otherLocale = computed(() => (locale.value === 'ar' ? 'en' : 'ar'))

function submit() {
  if (!canSubmit.value) return
  const e = email.value.trim().toLowerCase()
  if (mode.value === 'signin') auth.signIn(e, password.value)
  else auth.signUp(e, password.value, name.value)
}

// Changing tabs clears the old message.
watch(mode, auth.clearMessages)
</script>

<template>
  <div class="auth-page">
    <nuxt-link
      class="auth-lang"
      :to="switchLocalePath(otherLocale)"
      :hreflang="otherLocale"
      @click.prevent="withViewTransition(() => navigateTo(switchLocalePath(otherLocale)), 'locale')"
    >
      {{ otherLocale === 'ar' ? 'عربي' : 'English' }}
    </nuxt-link>

    <div class="lock-card">
      <div>
        <div class="lock-ico"><app-icon name="user" /></div>
        <h1>{{ t('app_title') }}</h1>
        <p class="lock-hint">{{ mode === 'signin' ? t('signin_pw_hint') : t('signup_pw_hint') }}</p>

        <segmented-control v-model="mode" :options="modes" :label="t('app_title')" />

        <form class="auth-form" novalidate @submit.prevent="submit">
          <template v-if="mode === 'signup'">
            <label class="field-label" for="name">{{ t('name_label') }}</label>
            <input
              id="name"
              v-model="name"
              class="field field-input"
              type="text"
              autocomplete="name"
              maxlength="40"
              :placeholder="t('name_placeholder')"
            />
          </template>

          <label class="field-label" :class="{ 'field-label-gap': mode === 'signup' }" for="email">{{ t('email_label') }}</label>
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
          <password-input
            id="password"
            v-model="password"
            :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'"
            :placeholder="mode === 'signup' ? t('password_hint') : ''"
          />

          <button class="btn lock-btn" type="submit" :disabled="!canSubmit" :aria-busy="busy">
            {{ mode === 'signin' ? (busy ? t('signing_in') : t('signin_pw_btn')) : (busy ? t('creating_account') : t('signup_pw_btn')) }}
          </button>

          <p v-if="notice" class="auth-notice" role="status">{{ t(notice) }}</p>
          <p v-if="error" class="field-error" role="alert">{{ t(error) }}</p>
        </form>
      </div>

    </div>
  </div>
</template>
