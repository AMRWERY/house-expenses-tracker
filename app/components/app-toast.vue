<template>
  <Transition name="toast">
    <div
      v-if="toast"
      :key="toast.id"
      class="toast"
      :class="{ 'toast-error': toast.kind === 'error' }"
      :role="toast.kind === 'error' ? 'alert' : 'status'"
      :aria-live="toast.kind === 'error' ? 'assertive' : 'polite'"
    >
      <span class="toast-text">{{ toast.text }}</span>
      <button
        v-if="toast.actionLabel"
        type="button"
        class="toast-action"
        @click="toastStore.runAction()"
      >
        {{ toast.actionLabel }}
      </button>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
const toastStore = useToastStore();

const { toast } = storeToRefs(toastStore);
</script>

<style scoped>
.toast {
  position: fixed;
  inset-inline: 16px;
  inset-block-end: max(96px, calc(env(safe-area-inset-bottom) + 88px));
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 420px;
  margin-inline: auto;
  padding: 12px 12px 12px 18px;
  padding-inline: 18px 12px;
  border-radius: 16px;
  background: var(--text);
  color: var(--bg);
  font-size: 15px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.3);
}

.toast-error {
  border-inline-start: 4px solid var(--expense);
}

.toast-action {
  height: 36px;
  padding-inline: 14px;
  border-radius: 12px;
  font-weight: 700;
  color: var(--primary);
  background: color-mix(in srgb, var(--bg) 12%, transparent);
  transition:
    transform 0.1s,
    background-color 0.2s;
}

.toast-action:active {
  transform: scale(0.97);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.25s ease-out,
    transform 0.25s ease-out;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-from,
  .toast-leave-to {
    transform: none;
  }
}
</style>