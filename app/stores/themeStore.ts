import type { ThemeMode } from "~/types/composables";

/**
 * Theme preference. Stored in localStorage; "system" follows the OS.
 * `?theme=light|dark` pins it for previews (`override`) without touching the stored value.
 */
export const useThemeStore = defineStore("theme", () => {
  const stored = useLocalStorage<ThemeMode>("theme", "system");
  const override = ref<"light" | "dark" | null>(null);
  const systemDark = ref(false);

  /** What the person chose (a pinned preview wins). Setting it saves the choice and drops the pin. */
  const mode = computed<ThemeMode>({
    get: () => override.value ?? stored.value,
    set: (v) => {
      override.value = null;
      stored.value = v;
    },
  });
  const resolved = computed<"light" | "dark">(() =>
    mode.value === "system"
      ? systemDark.value
        ? "dark"
        : "light"
      : mode.value,
  );

  function pin(value: unknown) {
    override.value = value === "light" || value === "dark" ? value : null;
  }

  /** Client only, once: follow the OS setting and write the resolved theme onto <html>. */
  function init() {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    systemDark.value = mq.matches;
    mq.addEventListener("change", (e) => (systemDark.value = e.matches));
    watch(resolved, (v) => (document.documentElement.dataset.theme = v), {
      immediate: true,
    });
  }

  return { mode, resolved, pin, init };
});
