<template>
  <label v-if="label" class="field-label" :class="{ 'field-label-gap': labelGap }" :for="id">{{ label }}</label>
  <div class="pw">
    <input
      :id="id"
      v-model="model"
      class="field field-input pw-input"
      :type="visible ? 'text' : 'password'"
      dir="ltr"
      maxlength="72"
      :autocomplete="autocomplete"
      :placeholder="placeholder ?? t('password_placeholder')"
    />
    <VIconButton
      class="pw-toggle"
      :icon="visible ? 'eyeOff' : 'eye'"
      :label="visible ? t('hide_password') : t('show_password')"
      :aria-pressed="visible"
      @click="visible = !visible"
    />
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();

defineProps<{
  id: string;
  autocomplete: "current-password" | "new-password";
  placeholder?: string;
  /** optional label rendered above the field */
  label?: string;
  labelGap?: boolean;
}>();

const model = defineModel<string>({ required: true });
const visible = ref(false);
</script>
