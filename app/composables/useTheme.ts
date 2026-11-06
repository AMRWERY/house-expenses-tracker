import type { ThemeMode } from "~/types/composables";

/**
 * Theme preference. Stored in localStorage; "system" follows the OS.
 * `?theme=light|dark` pins it for previews without touching the stored value.
 */
export function useTheme() {
  const route = useRoute();
  const forced =
    route.query.theme === "light" || route.query.theme === "dark"
      ? route.query.theme
      : null;
  const mode: Ref<ThemeMode> = forced
    ? ref<ThemeMode>(forced)
    : useLocalStorage<ThemeMode>("theme", "system");

  onMounted(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark =
        mode.value === "dark" || (mode.value === "system" && mq.matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
    };
    apply();
    mq.addEventListener("change", apply);
    const stop = watch(mode, apply);
    onBeforeUnmount(() => {
      mq.removeEventListener("change", apply);
      stop();
    });
  });

  return mode;
}