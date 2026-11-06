<template>
  <!-- Visibility comes from html[data-locked], set by an inline script before first paint,
       so the app's content never flashes before the lock. -->
  <div class="lock" role="dialog" aria-modal="true" :aria-label="t('locked_title')">
    <div class="lock-card">
      <div class="lock-ico"><AppIcon name="fingerprint" /></div>
      <h1>{{ t('app_title') }}</h1>
      <p class="lock-hint">{{ t('locked_hint') }}</p>
      <button class="btn lock-btn" :disabled="busy" @click="unlock()">
        <AppIcon name="fingerprint" />{{ t('unlock') }}
      </button>
      <p v-if="error" class="field-error" role="alert">{{ error }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n()
const { locked, busy, error, unlock } = useBiometric()

// Keep the html attribute (which drives the CSS) in step with the real state.
watch(locked, v => document.documentElement.toggleAttribute('data-locked', v), { immediate: false })

onMounted(() => {
  document.documentElement.toggleAttribute('data-locked', locked.value)
  // Try the prompt straight away; if the browser wants a tap first, the button is right there.
  if (locked.value) unlock(true)
})
</script>
