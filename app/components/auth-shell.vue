<template>
  <main class="auth-page">
    <!-- A plain link: <nuxt-link> also navigates on click and raced with the animated switch below. -->
    <a
      class="auth-lang"
      :href="otherLocaleHref"
      :hreflang="otherLocale"
      @click.prevent="withViewTransition(() => navigateTo(otherLocaleHref), 'locale')"
    >
      {{ otherLocale === 'ar' ? 'عربي' : 'English' }}
    </a>

    <div class="lock-card">
      <div>
        <h1>{{ t('app_title') }}</h1>
        <p class="lock-hint">{{ mode === 'signin' ? t('signin_pw_hint') : t('signup_pw_hint') }}</p>

        <slot />

        <p class="auth-switch">
          {{ mode === 'signin' ? t('no_account') : t('have_account') }}
          <a :href="otherPageHref" @click.prevent="navigateTo(otherPageHref)">
            {{ mode === 'signin' ? t('signup') : t('signin') }}
          </a>
        </p>
      </div>
    </div>
  </main>
</template>

<script lang="ts" setup>
/** Frame shared by the sign-in (/auth) and sign-up (/auth/sign-up) pages: language link, title and the link to the other page. */
type Mode = 'signin' | 'signup'

const props = defineProps<{ mode: Mode }>()

const { t, locale } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const auth = useAuthStore()

const otherLocale = computed(() => (locale.value === 'ar' ? 'en' : 'ar'))
// Each form is its own page, so the language link just keeps the current one.
const otherLocaleHref = computed(() => switchLocalePath(otherLocale.value))

// The other auth page: sign-in links to sign-up and the other way round.
const otherPageHref = computed(() => localePath(props.mode === 'signin' ? '/auth/sign-up' : '/auth'))

// A message from one page must not follow you to the other.
onBeforeUnmount(auth.clearMessages)
</script>
