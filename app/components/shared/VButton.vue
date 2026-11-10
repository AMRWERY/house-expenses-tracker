<template>
  <button :class="classes" :type="type" :aria-busy="busy">
    <slot />
  </button>
</template>

<script lang="ts" setup>
/**
 * The app's button. `solid` is the emerald call-to-action, `text` is the quiet one (add `danger` for destructive).
 * Any other attribute (disabled, @click, ...) goes straight to the <button>.
 */
const props = withDefaults(
  defineProps<{
    variant?: "solid" | "text";
    /** full width (used at the bottom of sheets and forms) */
    block?: boolean;
    danger?: boolean;
    /** a request is running: sets aria-busy so the CSS can show the busy state */
    busy?: boolean;
    type?: "button" | "submit";
  }>(),
  { variant: "solid", type: "button" },
);

const classes = computed(() => [
  props.variant === "text" ? "btn-text" : "btn",
  { "btn-block": props.block, danger: props.danger },
]);
</script>
