/** Per-person settings that live on the server. Today: opt-in budget rollover. */
export const useSettingsStore = defineStore("settings", () => {
  const expensesStore = useExpensesStore();
  const demo = isDemo(useRouter().currentRoute.value.query); // preview: local only, nothing is saved

  const rolloverEnabled = ref(false);
  /** the month rollover was turned on (0-based month); carry-over starts here, never earlier */
  const rolloverSince = ref<{ y: number; m: number } | null>(null);
  const loaded = ref(false);
  const saving = ref(false);
  const error = ref<"save_failed" | "">("");

  async function load() {
    if (loaded.value || demo) return;
    const fetcher = useRequestFetch(); // forwards the session cookie during SSR
    const s = await fetcher<{ rolloverEnabled: boolean; rolloverSince: { y: number; m: number } | null }>("/api/settings");
    rolloverEnabled.value = s.rolloverEnabled;
    rolloverSince.value = s.rolloverSince;
    loaded.value = true;
  }

  function reset() {
    rolloverEnabled.value = false;
    rolloverSince.value = null;
    loaded.value = false;
    saving.value = false;
    error.value = "";
  }

  /** Turn rollover on or off. The server must accept it before the screen changes. */
  async function setRollover(enabled: boolean) {
    if (saving.value) return;
    saving.value = true;
    error.value = "";
    const { y, m } = expensesStore.current;
    try {
      const s = demo
        ? { rolloverEnabled: enabled, rolloverSince: enabled && !rolloverEnabled.value ? { y, m } : rolloverSince.value }
        : await $fetch<{ rolloverEnabled: boolean; rolloverSince: { y: number; m: number } | null }>("/api/settings", {
            method: "PUT",
            body: { rolloverEnabled: enabled, y, m },
          });
      rolloverEnabled.value = s.rolloverEnabled;
      rolloverSince.value = s.rolloverSince;
    } catch {
      error.value = "save_failed";
    } finally {
      saving.value = false;
    }
  }

  return { rolloverEnabled, rolloverSince, loaded, saving, error, load, reset, setRollover };
});
