<template>
  <auth-shell mode="signin">
    <form class="auth-form" novalidate @submit.prevent="submit">
      <VTextField
        id="email"
        v-model="email"
        :label="t('email_label')"
        type="email"
        inputmode="email"
        dir="ltr"
        autocomplete="email"
        maxlength="254"
        placeholder="test@house.com"
        :aria-invalid="showEmailError"
        @blur="emailTouched = true"
      />
      <VError v-if="showEmailError" inline>{{ t("invalid_email") }}</VError>

      <password-input
        id="password"
        :label="t('password_label')"
        label-gap
        v-model="password"
        autocomplete="current-password"
      />

      <VButton
        class="lock-btn"
        type="submit"
        :disabled="!canSubmit"
        :busy="busy"
      >
        {{ busy ? t("signing_in") : t("signin_pw_btn") }}
      </VButton>

      <p v-if="notice" class="auth-notice" role="status">{{ t(notice) }}</p>
      <VError v-if="error" role="alert">{{
        t(error, { time: waitText })
      }}</VError>
    </form>
  </auth-shell>
</template>

<script lang="ts" setup>
definePageMeta({ layout: "blank" });

const { t } = useI18n();

const auth = useAuthStore();
const { busy, error, notice, waitText } = storeToRefs(auth);

const email = ref("");
const password = ref("");
const emailTouched = ref(false);

const emailValid = computed(() => EMAIL_RE.test(email.value.trim()));
const canSubmit = computed(
  () => emailValid.value && password.value.length > 0 && !busy.value,
);
const showEmailError = computed(
  () => emailTouched.value && email.value.trim() !== "" && !emailValid.value,
);

function submit() {
  if (!canSubmit.value) return;
  auth.signIn(email.value.trim().toLowerCase(), password.value);
}
</script>