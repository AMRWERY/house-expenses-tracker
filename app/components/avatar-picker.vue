<template>
  <div class="avatar-picker">
    <img class="avatar-img" :src="src" alt="" width="72" height="72" />
    <div class="avatar-actions">
      <VButton variant="text" :disabled="busy" :busy="busy" @click="input?.click()">
        {{ label }}
      </VButton>
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
  </div>
</template>

<script lang="ts" setup>
/** Round picture with a button to choose a new one. Emits `pick` with a resized data URL, or `error` with a message key. */
defineProps<{ src: string; label: string; busy?: boolean }>();
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
.avatar-img {
  flex: none;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--surface-alt);
  border: 2px solid var(--border);
  transition: border-color 0.2s;
}
.avatar-actions {
  min-width: 0;
}
</style>
