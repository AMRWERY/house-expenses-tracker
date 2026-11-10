<template>
  <div class="avatar-picker" :class="{ stacked }">
    <!-- The picture itself is the button: tap it, or the camera badge, to choose a file -->
    <button type="button" class="avatar-btn" :disabled="busy" :aria-label="label" @click="input?.click()">
      <img class="avatar-img" :src="src" alt="" width="96" height="96" />
      <span class="avatar-badge" aria-hidden="true"><app-icon name="camera" /></span>
    </button>

    <div class="avatar-text">
      <button type="button" class="avatar-label" :disabled="busy" :aria-busy="busy" @click="input?.click()">
        {{ label }}
      </button>
      <p v-if="hint" class="avatar-hint">{{ hint }}</p>
    </div>

    <input
      ref="input"
      class="sr-only"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      :aria-label="label"
      tabindex="-1"
      @change="onChange"
    />
  </div>
</template>

<script lang="ts" setup>
/**
 * Round picture with a camera badge, and a text button to choose a new one.
 * `stacked` centers it with the text underneath (sign-up); otherwise the text sits beside it (settings).
 * Emits `pick` with a resized data URL, or `error` with a message key.
 */
defineProps<{ src: string; label: string; hint?: string; busy?: boolean; stacked?: boolean }>();
const emit = defineEmits<{ pick: [dataUrl: string]; error: [key: "invalid_image"] }>();

const input = ref<HTMLInputElement>();

async function onChange() {
  const file = input.value?.files?.[0];
  if (!file) return;
  try {
    emit("pick", await fileToAvatar(file));
  } catch {
    emit("error", "invalid_image");
  } finally {
    if (input.value) input.value.value = ""; // picking the same file again must still fire
  }
}
</script>

<style scoped>
.avatar-picker {
  display: flex;
  align-items: center;
  gap: 16px;
}
.avatar-picker.stacked {
  flex-direction: column;
  gap: 10px;
  text-align: center;
}

.avatar-btn {
  position: relative;
  flex: none;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  transition: transform 0.2s ease-out;
}
.avatar-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 3px;
}
@media (hover: hover) {
  .avatar-btn:hover:not(:disabled) {
    transform: scale(1.04);
  }
  .avatar-btn:hover:not(:disabled) .avatar-badge {
    background: var(--primary-hover);
  }
}
.avatar-btn:active:not(:disabled) {
  transform: scale(0.97);
}
.avatar-btn:disabled {
  opacity: 0.6;
  cursor: progress;
}
.avatar-img {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: var(--surface-alt);
  border: 3px solid var(--surface);
  box-shadow: 0 0 0 2px var(--primary);
}
.avatar-badge {
  position: absolute;
  inset-block-end: 0;
  inset-inline-end: 0;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary);
  color: var(--on-primary);
  border: 3px solid var(--surface);
  transition: background-color 0.2s;
}
.avatar-badge :deep(.ico) {
  width: 15px;
  height: 15px;
}

.avatar-text {
  min-width: 0;
}
.avatar-label {
  font: inherit;
  font-weight: 600;
  color: var(--primary);
  padding: 4px 8px;
  border-radius: 8px;
}
.avatar-label:disabled {
  opacity: 0.6;
}
.avatar-hint {
  margin-top: 2px;
  font-size: 13px;
  color: var(--text-2);
}

@media (prefers-reduced-motion: reduce) {
  .avatar-btn:hover:not(:disabled),
  .avatar-btn:active:not(:disabled) {
    transform: none;
  }
}
</style>
