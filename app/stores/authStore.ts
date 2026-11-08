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
  function describe(e: unknown): AuthMessageKey {
    const err = e as {
      statusCode?: number;
      status?: number;
      data?: { message?: string };
    };
    const status = err.statusCode ?? err.status;
    const msg = err.data?.message;
    const passthrough = [
      "invalid_email",
      "invalid_name",
      "weak_password",
      "email_not_confirmed",
      "email_exists",
      "wrong_current_password",
      "same_password",
    ];
    if (msg && passthrough.includes(msg)) return msg as AuthMessageKey;
    if (status === 429) return "rate_limited";
    if (status === 401 && msg === "invalid_credentials")
      return "invalid_credentials";
    return "auth_failed";
  }

  function clearMessages() {
    error.value = "";
    notice.value = "";
  }

  /** `action` resolves 'done' (signed in), 'notice' (show the message, stay here) or false (failed). */
  async function run(action: () => Promise<"done" | "notice">) {
    if (busy.value) return;
    busy.value = true;
    clearMessages();
    try {
      if ((await action()) === "notice") return;
      await session.fetch();
      // The middleware loads this user's expenses on arrival.
      await navigateTo(useNuxtApp().$localePath("/"));
    } catch (e) {
      error.value = describe(e);
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

  const signUp = (email: string, password: string, name: string) =>
    run(async () => {
      const res = await $fetch<{ needsConfirmation: boolean }>(
        "/api/auth/register",
        {
          method: "POST",
          body: { email, password, name },
        },
      );
      if (res.needsConfirmation) {
        notice.value = "check_email"; // confirm the address first, then sign in
        return "notice";
      }
      return "done";
    });

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
    clearSession,
    logout,
    passwordBusy,
    passwordError,
    passwordNotice,
    clearPasswordMessages,
    changePassword,
  };
});