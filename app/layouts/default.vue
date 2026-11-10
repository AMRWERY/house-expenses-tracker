<template>
  <div class="shell">
    <sidebar />
    <div class="shell-main">
      <!-- Every page that needs a signed-in user shows the greeting on top -->
      <greeting-banner />
      <slot />
    </div>
    <app-toast />
  </div>
</template>

<script lang="ts" setup>

</script>