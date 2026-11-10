<template>
  <nuxt-link-locale v-if="to" class="icon-btn" :to="to" :aria-label="label">
    <app-icon :name="icon" />
  </nuxt-link-locale>
  <button v-else class="icon-btn" type="button" :aria-label="label">
    <app-icon :name="icon" />
  </button>
</template>

<script lang="ts" setup>
import type { IconName } from "~/utils/icons";

/** Round icon-only control. Pass `to` to make it a (localized) link, otherwise it is a button. */
defineProps<{ icon: IconName; label: string; to?: string }>();
</script>
