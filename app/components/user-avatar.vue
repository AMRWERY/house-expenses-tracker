<template>
  <img class="user-avatar" :src="avatarUrl" alt="" :width="size" :height="size" :style="{ '--size': `${size}px` }" />
</template>

<script lang="ts" setup>
/** The signed-in person's round profile picture (the default one until they upload their own). */
withDefaults(defineProps<{ size?: number }>(), { size: 40 });
const { avatarUrl } = storeToRefs(useAuthStore());
</script>

<style scoped>
.user-avatar {
  flex: none;
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  object-fit: cover;
  background: var(--surface-alt);
  border: 2px solid var(--border);
}
</style>
