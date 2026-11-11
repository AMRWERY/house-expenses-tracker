<template>
  <auth-shell mode="signup">
    <form class="auth-form" novalidate @submit.prevent="submit">
      <avatar-picker
        stacked
        style="margin-bottom: 24px"
        :src="avatar || DEFAULT_AVATAR"
        :label="avatar ? t('change_photo') : t('upload_photo')"
        :hint="t('photo_optional')"
        :removable="!!avatar"
        @remove="avatar = ''"
        @pick="
          avatar = $event;
          auth.clearMessages();
        "
        @error="error = $event"
      />
      <VTextField
        id="name"
        v-model="name"
        :label="t('name_label')"
        type="text"
        autocomplete="name"
        maxlength="40"
        :placeholder="t('name_placeholder')"
      />

      <VTextField
        id="email"
        v-model="email"
        :label="t('email_label')"
        label-gap
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
        autocomplete="new-password"
        :placeholder="t('password_hint')"
      />

      <VButton
        class="lock-btn"
        type="submit"
        :disabled="!canSubmit"
        :busy="busy"
      >
        {{
          busy
            ? t("creating_account")
            : signUpCooldown > 0
              ? `${t("signup_pw_btn")} (${cooldownClock})`
              : t("signup_pw_btn")
        }}
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
const { busy, error, notice, signUpCooldown, waitText } = storeToRefs(auth);

const name = ref("");
const email = ref("");
const password = ref("");
const emailTouched = ref(false);
// Optional profile picture (a resized data URL); without one the default picture is used.
const avatar = ref("");

const emailValid = computed(() => EMAIL_RE.test(email.value.trim()));
const passwordValid = computed(
  () => password.value.length >= 8 && password.value.length <= 72,
);
// The name (1-40 characters) is what the greeting calls you.
const nameValid = computed(
  () => name.value.trim().length >= 1 && name.value.trim().length <= 40,
);
const canSubmit = computed(
  () =>
    emailValid.value &&
    passwordValid.value &&
    nameValid.value &&
    signUpCooldown.value === 0 &&
    !busy.value,
);
const showEmailError = computed(
  () => emailTouched.value && email.value.trim() !== "" && !emailValid.value,
);

// Remaining wait on the button: 59:30, or 1:02:03 when it is an hour or more.
const cooldownClock = computed(() => {
  const s = signUpCooldown.value;
  const pad = (n: number) => String(n).padStart(2, "0");
  const [h, m, sec] = [
    Math.floor(s / 3600),
    Math.floor((s % 3600) / 60),
    s % 60,
  ];
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
});

function submit() {
  if (!canSubmit.value) return;
  auth.signUp(
    email.value.trim().toLowerCase(),
    password.value,
    name.value,
    avatar.value || undefined,
  );
}
</script>