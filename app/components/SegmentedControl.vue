<script lang="ts" setup generic="T extends string">
const props = defineProps<{
  modelValue: T
  options: { value: T; label: string }[]
  label: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: T] }>()

const index = computed(() => Math.max(0, props.options.findIndex(o => o.value === props.modelValue)))

// Arrow keys move the selection; "next" follows the reading direction.
const { locale } = useI18n()
function onKey(e: KeyboardEvent) {
  const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
  if (!dir) return
  e.preventDefault()
  const step = locale.value === 'ar' ? -dir : dir
  const n = props.options.length
  emit('update:modelValue', props.options[(index.value + step + n) % n]!.value)
}
</script>

<template>
  <div class="seg" role="radiogroup" :aria-label="label" :style="{ '--n': options.length, '--i': index }" @keydown="onKey">
    <span class="seg-ind" aria-hidden="true" />
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      role="radio"
      :aria-checked="o.value === modelValue"
      :tabindex="o.value === modelValue ? 0 : -1"
      @click="emit('update:modelValue', o.value)"
    >
      {{ o.label }}
    </button>
  </div>
</template>
