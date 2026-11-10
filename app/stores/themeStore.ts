import type { ThemeMode } from "~/types/composables";

/**
 * Theme preference: light or dark. Stored in localStorage; until the person picks one (or when an old
 * "system" value is stored) the OS setting decides the starting theme.
 * `?theme=light|dark` pins it for previews (`override`) without touching the stored value.
 */
export const useThemeStore = defineStore("theme", () => {
  // A cookie (not localStorage) so the server knows the saved theme too and renders the right option on first paint.
  const stored = useCookie<string>("theme", {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    default: () => "",
  });
  const override = ref<"light" | "dark" | null>(null);
  const systemDark = ref(false);

  /** What the person chose (a pinned preview wins). Setting it saves the choice and drops the pin. */
  const mode = computed<ThemeMode>({
    get: () =>
      override.value ??
      (stored.value === "light" || stored.value === "dark" ? stored.value : systemDark.value ? "dark" : "light"),
    set: (v) => {
      override.value = null;
      stored.value = v;
    },
  });
  const resolved = mode;

  function pin(value: unknown) {
    override.value = value === "light" || value === "dark" ? value : null;
  }

  /** Client only, once: follow the OS setting and write the resolved theme onto <html>. */
  function init() {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    // Earlier versions kept the choice in localStorage: carry it over once.
    if (!stored.value) {
      const old = localStorage.getItem("theme");
      if (old === "light" || old === "dark") stored.value = old;
    }
    systemDark.value = mq.matches; // only the starting theme: there is no "follow the OS" choice any more
    trackPointer();
    // The first value is applied at once; later changes grow out of where the person clicked.
    watch(
      resolved,
      (v, old) => {
        const apply = () => (document.documentElement.dataset.theme = v);
        if (old === undefined) apply();
        else withViewTransition(apply, "theme");
      },
      { immediate: true },
    );
  }

  return { mode, resolved, pin, init };
});
