<template>
  <VSheet v-if="ayah" title="" @close="close">
    <figure class="ayah">
      <blockquote class="ayah-text" lang="ar" dir="rtl">
        ﴿ {{ ayah.arabic }} ﴾
      </blockquote>
    </figure>
    <div v-if="ayah.audio" class="player" dir="ltr">
      <button
        class="player-btn"
        type="button"
        :aria-label="playing ? t('pause') : t('play')"
        @click="toggle"
      >
        <app-icon :name="playing ? 'pause' : 'play'" />
      </button>
      <div class="player-main">
        <input
          class="player-seek"
          type="range"
          min="0"
          max="100"
          step="0.1"
          :value="progress"
          :style="{ '--p': progress + '%' }"
          :aria-label="t('ayah_seek')"
          @input="seek"
        />
        <div class="player-time">
          <span>{{ clock(current) }}</span>
          <span>{{ clock(duration) }}</span>
        </div>
      </div>
    </div>
  </VSheet>
</template>

<script lang="ts" setup>
const { t, locale } = useI18n();
const store = useAyahStore();
const { ayah } = storeToRefs(store);

const playing = ref(false);
const current = ref(0);
const duration = ref(0);
const progress = computed(() =>
  duration.value ? (current.value / duration.value) * 100 : 0,
);
let audio: HTMLAudioElement | undefined;

const clock = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

function stop() {
  audio?.pause();
  audio = undefined;
  playing.value = false;
  current.value = 0;
}

const close = () => {
  stop();
  store.close();
};

function ensureAudio() {
  if (audio || !ayah.value?.audio) return audio;
  audio = new Audio(ayah.value.audio);
  audio.addEventListener(
    "loadedmetadata",
    () => (duration.value = audio?.duration ?? 0),
  );
  audio.addEventListener(
    "timeupdate",
    () => (current.value = audio?.currentTime ?? 0),
  );
  audio.addEventListener("pause", () => (playing.value = false));
  audio.addEventListener("play", () => (playing.value = true));
  audio.addEventListener("ended", () => {
    playing.value = false;
    current.value = 0;
  });
  audio.addEventListener("error", stop);
  return audio;
}

// Play or pause.
function toggle() {
  const el = ensureAudio();
  if (!el) return;
  if (!el.paused) return el.pause();
  el.play().catch(stop);
}

function seek(ev: Event) {
  const el = ensureAudio();
  if (!el || !duration.value) return;
  el.currentTime =
    (Number((ev.target as HTMLInputElement).value) / 100) * duration.value;
  current.value = el.currentTime;
}

const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && close();

// Once per app open: the store fetches a random Ayah through /api/ayah.
onMounted(async () => {
  await store.load(locale.value);
  if (ayah.value) window.addEventListener("keydown", onKey);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  stop();
});
</script>

<style scoped>
.ayah {
  margin: 0 0 20px;
  text-align: center;
}

.ayah-text {
  margin: 0;
  font-size: 26px;
  line-height: 2;
  font-weight: 500;
  color: var(--text);
}

.player {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border-radius: 16px;
  background: var(--surface-alt);
}
.player-btn {
  flex: none;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--primary);
  color: var(--on-primary);
  transition:
    background-color 0.2s,
    transform 0.1s;
}

.player-btn:hover {
  background: var(--primary-hover);
}

.player-btn:active {
  transform: scale(0.94);
}

.player-btn .ico {
  width: 22px;
  height: 22px;
}

.player-main {
  flex: 1;
  min-width: 0;
}

.player-seek {
  width: 100%;
  height: 20px;
  margin: 0;
  background: transparent;
  appearance: none;
  cursor: pointer;
}

.player-seek::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(
    to right,
    var(--primary) var(--p),
    var(--border) var(--p)
  );
}

.player-seek::-moz-range-track {
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(
    to right,
    var(--primary) var(--p),
    var(--border) var(--p)
  );
}

.player-seek::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  margin-top: -4px;
  border-radius: 50%;
  background: var(--primary);
}

.player-seek::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: 0;
  border-radius: 50%;
  background: var(--primary);
}

.player-time {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
}
</style>