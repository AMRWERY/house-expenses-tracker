<template>
  <button
    class="chip"
    type="button"
    :role="selected === undefined ? undefined : 'radio'"
    :aria-checked="selected"
  >
    <app-icon v-if="icon" :name="icon" />
    <slot />
  </button>
</template>

<script lang="ts" setup>
import type { IconName } from "~/utils/icons";

/**
 * Pill button. With `selected` it is one option of a radio group (put the group's role="radiogroup" on the parent);
 * without it, it is a plain action button.
 */
// `selected` defaults to undefined (not false) so a plain action chip gets no radio role.
withDefaults(defineProps<{ icon?: IconName; selected?: boolean }>(), { selected: undefined });
</script>
