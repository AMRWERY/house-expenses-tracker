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

const bio = useBiometric()
const toggleBiometric = () => (bio.enabled.value ? bio.disable() : bio.enable())

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

      <!-- Mobile only: shown when this device is a touch device with a fingerprint / Face ID sensor -->
      <section v-if="bio.available.value" class="setting rise" style="--i: 2">
        <h2>{{ t('security') }}</h2>
        <div class="setting-card setting-row">
          <span class="row-icon" style="--c: #10b981"><AppIcon name="fingerprint" /></span>
          <div class="row-text">
            <div class="row-title">{{ t('biometric_title') }}</div>
            <div class="row-cat">{{ t('biometric_desc') }}</div>
          </div>
          <button
            class="switch"
            role="switch"
            :aria-checked="bio.enabled.value"
            :aria-label="t('biometric_title')"
            :disabled="bio.busy.value"
            @click="toggleBiometric"
          />
        </div>
        <p v-if="bio.error.value" class="field-error" role="alert">{{ bio.error.value }}</p>
      </section>
    </main>
  </div>
</template>
