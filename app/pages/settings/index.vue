<template>
  <div class="app narrow">
    <header class="page-head">
      <VIconButton :icon="backIcon" :label="t('back')" to="/" />
      <h1>{{ t("settings") }}</h1>
    </header>

    <main>
      <section class="setting rise" style="--i: 0">
        <h2>{{ t("appearance") }}</h2>
        <div class="setting-card">
          <segmented-control
            v-model="theme"
            :options="themeOptions"
            :label="t('appearance')"
          />
        </div>
      </section>

      <section class="setting rise" style="--i: 1">
        <h2>{{ t("language") }}</h2>
        <div class="setting-card">
          <segmented-control
            :model-value="locale"
            :options="[...langOptions]"
            :label="t('language')"
            @update:model-value="withViewTransition(() => setLocale($event as 'ar' | 'en'), 'locale')"
          />
        </div>
      </section>

      <section v-if="user" class="setting rise" style="--i: 3">
        <h2>{{ t("change_password") }}</h2>
        <form class="setting-card" novalidate @submit.prevent="changePassword">
          <password-input
            id="current-password"
            :label="t('current_password')"
            v-model="currentPassword"
            autocomplete="current-password"
          />

          <password-input
            id="new-password"
            :label="t('new_password')"
            label-gap
            v-model="newPassword"
            autocomplete="new-password"
            :placeholder="t('password_hint')"
          />

          <password-input
            id="confirm-password"
            :label="t('confirm_password')"
            label-gap
            v-model="confirmPassword"
            autocomplete="new-password"
          />
          <VError v-if="mismatch" inline>
            {{ t("passwords_mismatch") }}
          </VError>

          <VButton block type="submit" :disabled="!canChangePassword" :busy="passwordBusy">
            {{ passwordBusy ? t("updating_password") : t("update_password") }}
          </VButton>

          <p v-if="passwordNotice" class="auth-notice" role="status">
            {{ t(passwordNotice) }}
          </p>
          <VError v-if="passwordError" sheet role="alert">
            {{ t(passwordError) }}
          </VError>
        </form>
      </section>

      <section v-if="user" class="setting rise" style="--i: 2">
        <h2>{{ t("account") }}</h2>
        <div class="setting-card">
          <div class="setting-row account-row">
            <span class="row-icon" style="--c: #10b981"
              ><app-icon name="user"
            /></span>
            <div class="row-text">
              <div class="row-title row-email" dir="ltr">{{ user.email }}</div>
              <div class="row-cat">{{ t("signed_in") }}</div>
            </div>
          </div>
          <VButton variant="text" danger :disabled="signingOut" :busy="signingOut" @click="signOut">
            {{ signingOut ? t("signing_out") : t("logout") }}
          </VButton>
        </div>
      </section>
    </main>
  </div>
</template>

<script lang="ts" setup>
const { t, locale, setLocale } = useI18n();
const { mode: theme } = storeToRefs(useThemeStore());

const themeOptions = computed<{ value: ThemeMode; label: string }[]>(() => [
  { value: "light", label: t("theme_light") },
  { value: "dark", label: t("theme_dark") },
  { value: "system", label: t("theme_system") },
]);

// Language names are always shown in their own language.
const langOptions = [
  { value: "ar", label: "عربي" },
  { value: "en", label: "English" },
] as const;

// Account: shown when signed in (not in the dev-only preview).
const auth = useAuthStore();
const { user } = storeToRefs(auth);
const { passwordBusy, passwordError, passwordNotice } = storeToRefs(auth);

// Change password
const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const newPasswordValid = computed(
  () => newPassword.value.length >= 8 && newPassword.value.length <= 72,
);
const mismatch = computed(
  () =>
    confirmPassword.value !== "" && confirmPassword.value !== newPassword.value,
);
const canChangePassword = computed(
  () =>
    currentPassword.value !== "" &&
    newPasswordValid.value &&
    confirmPassword.value === newPassword.value &&
    !passwordBusy.value,
);
async function changePassword() {
  if (!canChangePassword.value) return;
  if (await auth.changePassword(currentPassword.value, newPassword.value)) {
    currentPassword.value = newPassword.value = confirmPassword.value = "";
  }
}
onBeforeUnmount(auth.clearPasswordMessages);

// Sign out
const signingOut = ref(false);
async function signOut() {
  if (signingOut.value) return;
  signingOut.value = true;
  try {
    await auth.logout();
  } finally {
    signingOut.value = false;
  }
}

// "Back" points toward the inline-start edge, which flips with the language.
const backIcon = computed<IconName>(() =>
  locale.value === "ar" ? "arrowRight" : "arrowLeft",
);
</script>