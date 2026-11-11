/** i18n keys for everything the sign-in form can tell the person. */
import type { AuthMessageKey } from "~/types/stores/authStore";

/**
 * Sign-in / sign-up / sign-out (email + password, Supabase Auth via /api/auth/*).
 * The server sets the session cookie; nuxt-auth-utils' useUserSession() mirrors it on the client.
 * Messages are i18n KEYS: the page translates them, so the store has no language dependency.
 */
export const useAuthStore = defineStore("auth", () => {
  const session = useUserSession();
  const expensesStore = useExpensesStore();
  const sheetStore = useSheetStore();
  const categoriesStore = useCategoriesStore();
  const monthAmountStore = useMonthAmountStore();

  const busy = ref(false);
  const error = ref<AuthMessageKey | "">("");
  const notice = ref<AuthMessageKey | "">("");

  const user = computed(() => session.user.value);
  const loggedIn = computed(() => session.loggedIn.value);

  // Turn whatever went wrong into a short message key.
  // Seconds the server says to wait after a rate limit (Supabase's, or ours); shown as "{time}" in the message.
  const retryAfter = ref(60);
  const waitText = computed(() => {
    const { t } = useNuxtApp().$i18n;
    const s = retryAfter.value;
    if (s >= 3600) return t("wait_hours", Math.ceil(s / 3600));
    if (s >= 60) return t("wait_minutes", Math.ceil(s / 60));
    return t("wait_seconds", Math.max(1, s));
  });

  function describe(e: unknown): AuthMessageKey {
    const err = e as {
      statusCode?: number;
      status?: number;
      data?: { message?: string; data?: { retryAfter?: number } };
    };
    const status = err.statusCode ?? err.status;
    const msg = err.data?.message;
    if (status === 429) retryAfter.value = err.data?.data?.retryAfter || 60;
    const passthrough = [
      "invalid_email",
      "invalid_name",
      "weak_password",
      "email_not_confirmed",
      "email_exists",
      "wrong_current_password",
      "same_password",
      "invalid_image",
    ];
    if (msg && passthrough.includes(msg)) return msg as AuthMessageKey;
    if (status === 429) return "rate_limited";
    if (status === 401 && msg === "invalid_credentials")
      return "invalid_credentials";
    return "auth_failed";
  }

  // Sign-up results are shown as a toast (the message key is translated here, like the other stores do).
  function showToast(key: AuthMessageKey, kind: "success" | "error") {
    useToastStore().show({ text: useNuxtApp().$i18n.t(key, { time: waitText.value }), kind, position: "center" });
  }

  function clearMessages() {
    error.value = "";
    notice.value = "";
  }

  /** `action` resolves 'done' (signed in), 'notice' (show the message, stay here) or false (failed). */
  async function run(action: () => Promise<"done" | "notice">, asToast = false) {
    if (busy.value) return;
    busy.value = true;
    clearMessages();
    try {
      if ((await action()) === "notice") return;
      await session.fetch();
      // The middleware loads this user's expenses on arrival.
      await navigateTo(useNuxtApp().$localePath("/"));
    } catch (e) {
      const key = describe(e);
      if (asToast) {
        showToast(key, "error");
        if (key === "rate_limited") startSignUpCooldown(retryAfter.value);
      } else error.value = key;
    } finally {
      busy.value = false;
    }
  }

  const signIn = (email: string, password: string) =>
    run(async () => {
      await $fetch("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      return "done";
    });

  // When sign-up is rate limited the button stays disabled for exactly the wait the server reported
  // (the same time the toast shows), counting down once a second.
  const signUpCooldown = ref(0);
  let cooldownTimer: ReturnType<typeof setInterval> | undefined;

  function startSignUpCooldown(seconds: number) {
    clearInterval(cooldownTimer);
    signUpCooldown.value = seconds;
    cooldownTimer = setInterval(() => {
      if (--signUpCooldown.value <= 0) clearInterval(cooldownTimer);
    }, 1000);
  }

  const signUp = (email: string, password: string, name: string, avatar?: string) =>
    run(async () => {
      const res = await $fetch<{ needsConfirmation: boolean }>(
        "/api/auth/register",
        {
          method: "POST",
          body: { email, password, name, avatar },
        },
      );
      if (res.needsConfirmation) {
        showToast("check_email", "success"); // confirm the address first, then sign in
        return "notice";
      }
      return "done";
    }, true);

  /** End the session and never leave one person's data in memory for the next. */
  async function clearSession() {
    await session.clear();
    expensesStore.reset();
    categoriesStore.reset();
    monthAmountStore.reset();
    sheetStore.close();
  }

  // Change password (Settings). Has its own busy/message state so it never mixes with the sign-in form's.
  const passwordBusy = ref(false);
  const passwordError = ref<AuthMessageKey | "">("");
  const passwordNotice = ref<AuthMessageKey | "">("");

  function clearPasswordMessages() {
    passwordError.value = "";
    passwordNotice.value = "";
  }

  /** Resolves true when the password was changed. */
  async function changePassword(currentPassword: string, newPassword: string) {
    if (passwordBusy.value) return false;
    passwordBusy.value = true;
    clearPasswordMessages();
    try {
      await $fetch("/api/auth/password", {
        method: "POST",
        body: { currentPassword, newPassword },
      });
      passwordNotice.value = "password_changed";
      return true;
    } catch (e) {
      passwordError.value = describe(e);
      return false;
    } finally {
      passwordBusy.value = false;
    }
  }

  // Profile picture. The picture itself is served by /api/avatar; the version in the URL makes the browser
  // fetch it again after an upload (and the server answers with the default picture when there is none).
  const avatarVersion = ref(0);
  const avatarUrl = computed(() => `/api/avatar?v=${avatarVersion.value}`);
  const avatarBusy = ref(false);
  const avatarError = ref<AuthMessageKey | "">("");

  /** Resolves true when the new picture was saved. */
  async function uploadAvatar(image: string) {
    if (avatarBusy.value) return false;
    avatarBusy.value = true;
    avatarError.value = "";
    try {
      await $fetch("/api/avatar", { method: "POST", body: { image } });
      avatarVersion.value++;
      return true;
    } catch (e) {
      const msg = (e as { data?: { message?: string } }).data?.message;
      avatarError.value = msg === "invalid_image" ? "invalid_image" : "avatar_failed";
      return false;
    } finally {
      avatarBusy.value = false;
    }
  }

  async function logout() {
    await clearSession();
    await navigateTo(useNuxtApp().$localePath("/login"));
  }

  return {
    busy,
    error,
    notice,
    user,
    loggedIn,
    clearMessages,
    signIn,
    signUp,
    signUpCooldown,
    waitText,
    clearSession,
    logout,
    passwordBusy,
    passwordError,
    passwordNotice,
    clearPasswordMessages,
    changePassword,
    avatarUrl,
    avatarBusy,
    avatarError,
    uploadAvatar,
  };
});