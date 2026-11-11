<template>
  <div class="app narrow">
    <header class="page-head">
      <VIconButton :icon="backIcon" :label="t('back')" to="/" />
      <h1>{{ t("settings") }}</h1>
    </header>

    <main>
      <segmented-control
        v-if="tabs.length > 1"
        v-model="tab"
        class="settings-tabs"
        :options="tabs"
        :label="t('settings')"
      />

      <!-- Preferences: look and language -->
      <template v-if="tab === 'preferences'">
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
              @update:model-value="
                withViewTransition(
                  () => setLocale($event as 'ar' | 'en'),
                  'locale',
                )
              "
            />
          </div>
        </section>
      </template>

      <!-- Profile: picture, name, email -->
      <template v-else-if="tab === 'profile' && user">
        <section class="setting rise" style="--i: 0">
          <h2>{{ t("profile_picture") }}</h2>
          <div class="setting-card">
            <avatar-picker
              stacked
              :src="avatarUrl"
              :label="t('change_photo')"
              :hint="t('photo_formats')"
              :busy="avatarBusy"
              @pick="changeAvatar"
              @error="avatarError = $event"
            />
            <VError v-if="avatarError" inline role="alert">{{
              t(avatarError)
            }}</VError>
          </div>
        </section>

        <section class="setting rise" style="--i: 1">
          <h2>{{ t("display_name") }}</h2>
          <form class="setting-card" novalidate @submit.prevent="saveName">
            <VTextField
              id="display-name"
              v-model="nameInput"
              :label="t('name_label')"
              type="text"
              autocomplete="name"
              maxlength="40"
              :placeholder="t('name_placeholder')"
            />
            <p class="field-hint">{{ t("name_hint") }}</p>
            <VButton
              block
              type="submit"
              :disabled="!canSaveName"
              :busy="nameBusy"
            >
              {{ nameBusy ? t("saving_name") : t("save_name") }}
            </VButton>
            <VError v-if="nameError" sheet role="alert">
              {{ t(nameError) }}
            </VError>
          </form>
        </section>

        <section class="setting rise" style="--i: 2">
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
          </div>
        </section>
      </template>

      <!-- Security: password and sign out -->
      <template v-else-if="tab === 'security' && user">
        <section class="setting rise" style="--i: 0">
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
              :placeholder="t('confirm_password_placeholder')"
            />
            <VError v-if="mismatch" inline>
              {{ t("passwords_mismatch") }}
            </VError>

            <VButton
              block
              type="submit"
              :disabled="!canChangePassword"
              :busy="passwordBusy"
            >
              {{ passwordBusy ? t("updating_password") : t("update_password") }}
            </VButton>

            <p v-if="passwordNotice" class="auth-notice" role="status">
              {{ t(passwordNotice) }}
            </p>
            <div
              v-if="logoutIn > 0"
              class="logout-timer"
              role="status"
              :style="{ '--dur': LOGOUT_DELAY + 's' }"
            >
              <span class="logout-ring" aria-hidden="true">
                <svg viewBox="0 0 40 40">
                  <circle class="logout-ring-track" cx="20" cy="20" r="17" />
                  <circle class="logout-ring-bar" cx="20" cy="20" r="17" />
                </svg>
                <span :key="logoutIn" class="logout-num">{{ logoutIn }}</span>
              </span>
              <span>{{ t("password_logout_in", { s: logoutIn }) }}</span>
            </div>
            <VError v-if="passwordError" sheet role="alert">
              {{ t(passwordError, { time: auth.waitText }) }}
            </VError>
          </form>
        </section>

        <section class="setting rise" style="--i: 1">
          <div class="setting-card">
            <VButton
              variant="text"
              danger
              :disabled="signingOut"
              :busy="signingOut"
              @click="signOut"
            >
              {{ signingOut ? t("signing_out") : t("logout") }}
            </VButton>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

<script lang="ts" setup>
const { t, locale, setLocale } = useI18n();
const { mode: theme } = storeToRefs(useThemeStore());

const themeOptions = computed<{ value: ThemeMode; label: string }[]>(() => [
  { value: "light", label: t("theme_light") },
  { value: "dark", label: t("theme_dark") },
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
const { avatarUrl, avatarBusy, avatarError } = storeToRefs(auth);

// Tabs: Preferences is always there; Profile and Security need a signed-in user (not in the dev-only preview).
type Tab = "preferences" | "profile" | "security";
const tabs = computed<{ value: Tab; label: string }[]>(() => [
  { value: "preferences", label: t("tab_preferences") },
  ...(user.value
    ? [
        { value: "profile" as const, label: t("tab_profile") },
        { value: "security" as const, label: t("tab_security") },
      ]
    : []),
]);
// The tab lives in the URL (?tab=), so a refresh or a language switch (which keeps the query) stays on it.
const route = useRoute();
const router = useRouter();
const tab = computed<Tab>({
  get() {
    const q = route.query.tab;
    return tabs.value.some((o) => o.value === q) ? (q as Tab) : "preferences";
  },
  set(value) {
    router.replace({ query: { ...route.query, tab: value } });
  },
});

// Display name
const { nameBusy, nameError } = storeToRefs(auth);
const nameInput = ref(user.value?.name ?? "");
watch(
  () => user.value?.name,
  (n) => (nameInput.value = n ?? ""),
);
const canSaveName = computed(() => {
  const n = nameInput.value.trim().replace(/\s+/g, " ");
  return (
    n.length >= 1 &&
    n.length <= 40 &&
    n !== (user.value?.name ?? "") &&
    !nameBusy.value
  );
});
async function saveName() {
  if (!canSaveName.value) return;
  if (await auth.updateName(nameInput.value))
    useToastStore().show({ text: t("name_updated") });
}

// Profile picture
async function changeAvatar(image: string) {
  if (await auth.uploadAvatar(image))
    useToastStore().show({ text: t("avatar_updated") });
}

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
    !passwordBusy.value &&
    logoutIn.value === 0,
);

// After a password change the person is signed out automatically, with a short visible countdown.
const LOGOUT_DELAY = 3;
const logoutIn = ref(0);
let logoutTimer: ReturnType<typeof setInterval> | undefined;
function startLogoutCountdown() {
  clearInterval(logoutTimer);
  logoutIn.value = LOGOUT_DELAY;
  logoutTimer = setInterval(() => {
    if (--logoutIn.value > 0) return;
    clearInterval(logoutTimer);
    signOut();
  }, 1000);
}
async function changePassword() {
  if (!canChangePassword.value) return;
  if (await auth.changePassword(currentPassword.value, newPassword.value)) {
    currentPassword.value = newPassword.value = confirmPassword.value = "";
    startLogoutCountdown();
  }
}

onBeforeUnmount(() => {
  clearInterval(logoutTimer);
  nameError.value = "";
  auth.clearPasswordMessages();
});

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