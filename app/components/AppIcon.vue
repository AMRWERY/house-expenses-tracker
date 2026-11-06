<template>
  <svg
    class="ico"
    viewBox="0 0 24 24"
    aria-hidden="true"
    v-html="ICONS[name]"
  />
</template>

<script lang="ts" setup>
defineProps<{ name: IconName }>();
</script>