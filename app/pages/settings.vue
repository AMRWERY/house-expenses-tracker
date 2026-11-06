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

// "Back" points toward the inline-start edge, which flips with the language.
const backIcon = computed<IconName>(() => (locale.value === 'ar' ? 'arrowRight' : 'arrowLeft'))
</script>

<template>
  <div class="app narrow">
    <header class="page-head">
      <nuxt-link-locale class="icon-btn" :to="localePath('/')" :aria-label="t('back')">
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
    </main>
  </div>
</template>
