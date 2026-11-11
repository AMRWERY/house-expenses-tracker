<template>
  <div class="avatar-picker" :class="{ stacked }">
    <!-- The picture itself is the button: tap it, or the camera badge, to choose a file -->
    <div class="avatar-wrap">
      <button type="button" class="avatar-btn" :disabled="busy" :aria-label="label" @click="input?.click()">
        <img class="avatar-img" :src="src" alt="" width="96" height="96" />
        <span class="avatar-badge" aria-hidden="true"><app-icon name="camera" /></span>
      </button>
      <!-- Sibling of the picture button (a button can't sit inside another): removes the picture -->
      <button
        v-if="removable"
        type="button"
        class="avatar-remove"
        :disabled="busy"
        :aria-label="removeLabel"
        :title="removeLabel"
        @click="emit('remove')"
      >
        <app-icon name="x" />
      </button>
    </div>

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
 * `removable` adds an x on the picture that emits `remove` (back to the default picture).
 */
defineProps<{
  src: string;
  label: string;
  hint?: string;
  busy?: boolean;
  stacked?: boolean;
  removable?: boolean;
}>();
const emit = defineEmits<{ pick: [dataUrl: string]; error: [key: "invalid_image"]; remove: [] }>();
const { t } = useI18n();
const removeLabel = computed(() => t("remove_photo"));

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

.avatar-wrap {
  position: relative;
  flex: none;
  width: 96px;
  height: 96px;
}
.avatar-remove {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  /* Soft blue tint (not the app's green) so it reads as a different action from the camera badge. */
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
  box-shadow: var(--shadow);
  transition:
    background-color 0.2s,
    color 0.2s,
    transform 0.1s;
}
.avatar-remove :deep(.ico) {
  width: 14px;
  height: 14px;
}
.avatar-remove:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
.avatar-remove:disabled {
  opacity: 0.6;
}
@media (hover: hover) {
  .avatar-remove:hover:not(:disabled) {
    background: #2563eb;
    color: #fff;
    border-color: #2563eb;
  }
}
:global(:root[data-theme="dark"]) .avatar-remove {
  background: #172a4a;
  color: #60a5fa;
  border-color: #1e3a6e;
}
@media (hover: hover) {
  :global(:root[data-theme="dark"]) .avatar-remove:hover:not(:disabled) {
    background: #60a5fa;
    color: #0f172a;
    border-color: #60a5fa;
  }
}
.avatar-remove:active:not(:disabled) {
  transform: scale(0.92);
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
