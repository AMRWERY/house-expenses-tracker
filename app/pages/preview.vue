<script lang="ts" setup>
// Dev-only design review page: every screen in Light and Dark, plus Home across mobile / tablet / desktop.
// `demo=1` shows local sample data without signing in (only honoured in dev builds).
const D = 'today=2026-11-06&demo=1'
const frames = [
  // Phone: fingerprint / Face ID only (touch=1 forces the phone layout in a desktop browser)
  { group: 'Sign in · phone', label: 'Light', url: `/ar/login?theme=light&touch=1`, w: 390, h: 800 },
  { group: 'Sign in · phone', label: 'Dark', url: `/ar/login?theme=dark&touch=1`, w: 390, h: 800 },
  // Desktop: email + password
  { group: 'Sign in · desktop', label: 'Sign in · Light', url: `/ar/login?theme=light`, w: 1280, h: 760 },
  { group: 'Sign in · desktop', label: 'Sign in · Dark', url: `/ar/login?theme=dark`, w: 1280, h: 760 },
  { group: 'Sign in · desktop', label: 'New account · Light', url: `/ar/login?theme=light&mode=signup`, w: 1280, h: 760 },
  { group: 'Sign in · desktop', label: 'New account · Dark', url: `/ar/login?theme=dark&mode=signup`, w: 1280, h: 760 },
  { group: 'Home', label: 'Home · Light', url: `/ar?theme=light&${D}`, w: 390, h: 800 },
  { group: 'Home', label: 'Home · Dark', url: `/ar?theme=dark&${D}`, w: 390, h: 800 },
  { group: 'Home', label: 'Empty · Light', url: `/ar?theme=light&empty=1&${D}`, w: 390, h: 800 },
  { group: 'Home', label: 'Empty · Dark', url: `/ar?theme=dark&empty=1&${D}`, w: 390, h: 800 },
  { group: 'Add expense', label: 'Add · Light', url: `/ar?theme=light&sheet=add&${D}`, w: 390, h: 800 },
  { group: 'Add expense', label: 'Add · Dark', url: `/ar?theme=dark&sheet=add&${D}`, w: 390, h: 800 },
  { group: 'Add expense', label: 'Edit · Light', url: `/ar?theme=light&sheet=edit&${D}`, w: 390, h: 800 },
  { group: 'Add expense', label: 'Edit · Dark', url: `/ar?theme=dark&sheet=edit&${D}`, w: 390, h: 800 },
  { group: 'Settings', label: 'Settings · Light', url: `/ar/settings?theme=light&${D}`, w: 390, h: 800 },
  { group: 'Settings', label: 'Settings · Dark', url: `/ar/settings?theme=dark&${D}`, w: 390, h: 800 },
  { group: 'Compare', label: 'Compare · Light', url: `/ar/compare?theme=light&${D}`, w: 390, h: 800 },
  { group: 'Compare', label: 'Compare · Dark', url: `/ar/compare?theme=dark&${D}`, w: 390, h: 800 },
  { group: 'Small phone', label: 'Home · Light', url: `/ar?theme=light&${D}`, w: 320, h: 640 },
  { group: 'Small phone', label: 'Add · Dark', url: `/ar?theme=dark&sheet=add&${D}`, w: 320, h: 640 },
  { group: 'Tablet', label: 'Home · Light', url: `/ar?theme=light&${D}`, w: 768, h: 900 },
  { group: 'Tablet', label: 'Add · Dark', url: `/ar?theme=dark&sheet=add&${D}`, w: 768, h: 900 },
  { group: 'Desktop', label: 'Sign in · Light', url: `/ar/login?theme=light`, w: 1280, h: 760 },
  { group: 'Desktop', label: 'Home · Light', url: `/ar?theme=light&${D}`, w: 1280, h: 760 },
  { group: 'Desktop', label: 'Home · Dark', url: `/ar?theme=dark&${D}`, w: 1280, h: 760 },
  { group: 'Desktop', label: 'Edit · Light', url: `/ar?theme=light&sheet=edit&${D}`, w: 1280, h: 760 },
  { group: 'Desktop', label: 'Compare · Light', url: `/ar/compare?theme=light&${D}`, w: 1280, h: 760 },
  { group: 'Desktop', label: 'Compare · Dark', url: `/ar/compare?theme=dark&${D}`, w: 1280, h: 760 },
  { group: 'Desktop', label: 'Settings · Dark', url: `/ar/settings?theme=dark&${D}`, w: 1280, h: 760 },
  { group: 'Wide', label: 'Home · Light', url: `/ar?theme=light&${D}`, w: 1600, h: 800 },
]
</script>

<template>
  <div class="preview">
    <figure v-for="f in frames" :key="f.group + f.label">
      <iframe :src="f.url" :title="`${f.group} ${f.label}`" :style="{ width: f.w + 'px', height: f.h + 'px' }" />
      <figcaption>{{ f.group }} · {{ f.label }} · {{ f.w }}px</figcaption>
    </figure>
  </div>
</template>

<style scoped>
.preview { display: flex; flex-wrap: wrap; gap: 32px; justify-content: center; align-items: flex-start; padding: 32px 16px; background: #E2E8F0; min-height: 100vh; font: 600 14px system-ui, sans-serif; color: #334155; }
figure { margin: 0; text-align: center; max-width: 100%; overflow-x: auto; }
iframe { display: block; border: 0; border-radius: 20px; margin-bottom: 12px; box-shadow: 0 12px 40px rgba(15, 23, 42, .18); max-width: none; }
</style>
