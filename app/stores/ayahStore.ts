export interface Ayah {
  arabic: string;
  audio?: string;
  translation?: string;
  numberInSurah: number;
  surahName: string;
  surahEnglishName: string;
}

const SEEN_KEY = "ayah-seen";

/** Session storage lasts until the tab/browser is closed, so a refresh keeps it and reopening the site clears it. */
function seenThisSession() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

/** The Ayah shown in a dialog once each time the site is opened (not on refresh or navigation). */
export const useAyahStore = defineStore("ayah", () => {
  const ayah = ref<Ayah | null>(null);
  let requested = false;

  /** Fetch one Ayah from our server (once per page load). A failure just means no dialog. */
  async function load(lang: string) {
    if (requested || seenThisSession()) return;
    requested = true;
    try {
      ayah.value = await $fetch<Ayah>("/api/ayah", { query: { lang } });
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* storage blocked: it will simply show again next load */
      }
    } catch {
      /* offline or the Quran API is down: skip the dialog */
    }
  }

  function close() {
    ayah.value = null;
  }

  return { ayah, load, close };
});
