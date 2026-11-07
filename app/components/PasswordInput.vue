<template>
  <div class="pw">
    <input
      :id="id"
      v-model="model"
      class="field field-input pw-input"
      :type="visible ? 'text' : 'password'"
      dir="ltr"
      maxlength="72"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
    />
    <button
      class="icon-btn pw-toggle"
      type="button"
      :aria-label="visible ? t('hide_password') : t('show_password')"
      :aria-pressed="visible"
      @click="visible = !visible"
    >
      <AppIcon :name="visible ? 'eyeOff' : 'eye'" />
    </button>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  id: string;
  autocomplete: "current-password" | "new-password";
  placeholder?: string;
}>();

const { t } = useI18n();
const model = defineModel<string>({ required: true });
const visible = ref(false);
</script>
