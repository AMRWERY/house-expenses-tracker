<template>
  <label class="field-label" :class="{ 'field-label-gap': labelGap }" :for="id">{{ label }}</label>
  <input :id="id" v-model="model" class="field field-input" v-bind="$attrs" />
</template>

<script lang="ts" setup>
defineOptions({ inheritAttrs: false });

/** Label plus text input. Other attributes (type, maxlength, placeholder, aria-*, @blur, ...) go to the <input>. */
defineProps<{ id: string; label: string; labelGap?: boolean }>();
const model = defineModel<string>({ required: true });
</script>
