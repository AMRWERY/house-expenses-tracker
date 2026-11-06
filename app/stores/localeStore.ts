import type { SupportedLocales } from "~/types/i18n-types";

export const useLocaleStore = defineStore("locales", () => {
  // State
  const locale = useLocalStorage<SupportedLocales>("locale", "ar");
  const isOverlayVisible = ref(false);

  // Getters
  const isRTL = computed(() => locale.value === "ar");

  // Actions
  const updateLocale = async (
    newLocale: SupportedLocales,
    preventNavigation: boolean = false,
  ) => {
    if (!import.meta.client) return;

    isOverlayVisible.value = true;
    const nuxtApp = useNuxtApp();

    // Store current route to prevent navigation
    const route = useRoute();
    const currentPath = route.path;
    const currentQuery = { ...route.query };

    // Safely access i18n
    if (nuxtApp.$i18n) {
      const i18n = nuxtApp.$i18n as any;
      if (preventNavigation) {
        // Set locale directly without triggering navigation
        i18n.locale.value = newLocale;
      } else {
        if (i18n.setLocale) {
          await i18n.setLocale(newLocale);
        }
      }
    }

    // Update state
    locale.value = newLocale;

    if (typeof document !== "undefined") {
      document.documentElement.dir = newLocale === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = newLocale;
    }

    // If navigation was prevented and route changed, restore it
    if (preventNavigation) {
      await nextTick();
      if (route.path !== currentPath) {
        await navigateTo(
          { path: currentPath, query: currentQuery },
          { replace: true, external: false },
        );
      }
    }

    if (import.meta.client) {
      const { start: startOverlayTimer } = useTimeoutFn(
        () => {
          isOverlayVisible.value = false;
        },
        2000,
        { immediate: false },
      );

      startOverlayTimer();
    }
  };

  // loadLocale is no longer needed as useLocalStorage handles it automatically
  const loadLocale = (): void => {
    // Kept for backward compatibility if needed, but logic is handled by useLocalStorage
  };

  return {
    locale,
    isOverlayVisible,
    isRTL,
    updateLocale,
    loadLocale,
  };
});
