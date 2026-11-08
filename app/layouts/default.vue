<template>
  <div class="shell">
    <AppSidebar />
    <div class="shell-main">
      <!-- Every page that needs a signed-in user shows the greeting on top -->
      <GreetingBanner />
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>

</script>
