<template>
  <p class="field-error" :class="{ 'field-error-inline': inline, 'sheet-error': sheet }">
    <slot />
  </p>
</template>

<script lang="ts" setup>
/** Red message under a field (`inline`) or above a sheet's button (`sheet`). Add role="alert" when it is not tied to a field. */
defineProps<{ inline?: boolean; sheet?: boolean }>();
</script>
