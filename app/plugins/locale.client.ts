import type { SupportedLocales } from "~/types/i18n-types";

/**
 * The URL prefix (/ar, /en) decides the language: the server renders with it
 * and "/" is redirected using the cookie (server/middleware/default-locale.ts).
 * So this plugin only copies the active language into the locale store, and
 * never switches i18n itself; doing that on load made the browser render a
 * different language than the server sent, which broke hydration.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const syncStoredLocale = (): void => {
    try {
      const i18n = nuxtApp.$i18n as any;
      const active = i18n?.locale?.value;
      if (active !== "en" && active !== "ar") return;

      const store = useLocaleStore();
      if (store.locale !== active) store.locale = active as SupportedLocales;

      document.documentElement.lang = active;
      document.documentElement.dir = active === "ar" ? "rtl" : "ltr";
    } catch (error) {
      console.error("Error syncing locale:", error);
    }
  };

  syncStoredLocale();
  nuxtApp.hook("page:finish", syncStoredLocale);
});
