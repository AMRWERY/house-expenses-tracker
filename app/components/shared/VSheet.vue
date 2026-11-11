<template>
  <div class="sheet-root">
    <div class="backdrop" @click="emit('close')" />

    <div class="sheet" role="dialog" aria-modal="true" :aria-label="title">
      <div class="grab" aria-hidden="true" />

      <div class="sheet-head">
        <!-- With a leading control (e.g. a back button) the title sits next to it -->
        <div v-if="$slots.lead" class="sheet-title">
          <slot name="lead" />
          <h2>{{ title }}</h2>
        </div>
        <h2 v-else>{{ title }}</h2>
        <VIconButton icon="x" :label="t('close')" @click="emit('close')" />
      </div>

      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();

/** Bottom sheet shell: backdrop, grab handle, title row with a close button, then the content. */
defineProps<{ title: string }>();

const emit = defineEmits<{ close: [] }>();
</script>