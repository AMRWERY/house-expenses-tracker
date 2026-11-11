<script lang="ts" setup>
definePageMeta({ layout: 'blank' })

const { t, locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const auth = useAuthStore()
const { busy, error, notice, signUpCooldown } = storeToRefs(auth)

type Mode = 'signin' | 'signup'
const mode = ref<Mode>(useRoute().query.mode === 'signup' ? 'signup' : 'signin')
const name = ref('')
const email = ref('')
const password = ref('')
const emailTouched = ref(false)
// Optional profile picture chosen at sign-up (a resized data URL); without one the default picture is used.
const avatar = ref('')

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
  () =>
    emailValid.value &&
    passwordValid.value &&
    (mode.value === 'signin' || (nameValid.value && signUpCooldown.value === 0)) &&
    !busy.value,
)
const showEmailError = computed(() => emailTouched.value && email.value.trim() !== '' && !emailValid.value)

const otherLocale = computed(() => (locale.value === 'ar' ? 'en' : 'ar'))

function submit() {
  if (!canSubmit.value) return
  const e = email.value.trim().toLowerCase()
  if (mode.value === 'signin') auth.signIn(e, password.value)
  else auth.signUp(e, password.value, name.value, avatar.value || undefined)
}

// Changing tabs clears the old message.
watch(mode, auth.clearMessages)
</script>

<template>
  <main class="auth-page">
    <!-- A plain link: <nuxt-link> also navigates on click and raced with the animated switch below. -->
    <a
      class="auth-lang"
      :href="switchLocalePath(otherLocale)"
      :hreflang="otherLocale"
      @click.prevent="withViewTransition(() => navigateTo(switchLocalePath(otherLocale)), 'locale')"
    >
      {{ otherLocale === 'ar' ? 'عربي' : 'English' }}
    </a>

    <div class="lock-card">
      <div>
        <h1>{{ t('app_title') }}</h1>
        <p class="lock-hint">{{ mode === 'signin' ? t('signin_pw_hint') : t('signup_pw_hint') }}</p>

        <segmented-control v-model="mode" :options="modes" :label="t('app_title')" />

        <form class="auth-form" novalidate @submit.prevent="submit">
          <template v-if="mode === 'signup'">
            <avatar-picker
              stacked
              style="margin-bottom: 24px"
              :src="avatar || DEFAULT_AVATAR"
              :label="avatar ? t('change_photo') : t('upload_photo')"
              :hint="t('photo_optional')"
              @pick="avatar = $event; auth.clearMessages()"
              @error="error = $event"
            />
            <VTextField
              id="name"
              v-model="name"
              :label="t('name_label')"
              type="text"
              autocomplete="name"
              maxlength="40"
              :placeholder="t('name_placeholder')"
            />
          </template>

          <VTextField
            id="email"
            v-model="email"
            :label="t('email_label')"
            :label-gap="mode === 'signup'"
            type="email"
            inputmode="email"
            dir="ltr"
            autocomplete="email"
            maxlength="254"
            placeholder="test@house.com"
            :aria-invalid="showEmailError"
            @blur="emailTouched = true"
          />
          <VError v-if="showEmailError" inline>{{ t('invalid_email') }}</VError>

          <password-input
            id="password"
            :label="t('password_label')"
            label-gap
            v-model="password"
            :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'"
            :placeholder="mode === 'signup' ? t('password_hint') : ''"
          />

          <VButton class="lock-btn" type="submit" :disabled="!canSubmit" :busy="busy">
            {{ mode === 'signin' ? (busy ? t('signing_in') : t('signin_pw_btn')) : (busy ? t('creating_account') : signUpCooldown > 0 ? `${t('signup_pw_btn')} (${signUpCooldown})` : t('signup_pw_btn')) }}
          </VButton>

          <p v-if="notice" class="auth-notice" role="status">{{ t(notice) }}</p>
          <VError v-if="error" role="alert">{{ t(error) }}</VError>
        </form>
      </div>

    </div>
  </main>
</template>
