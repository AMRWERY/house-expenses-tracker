<template>
  <div v-if="user" class="greet-wrap">
    <section class="greet" :aria-label="t('greeting_label')">
      <!-- The clock is client-only: the card keeps its size and fills in on the first tick -->
      <template v-if="now">
        <span class="greet-icon" :style="{ '--c': PERIOD_COLOR[period] }">
          <greeting-icon :period="period" />
        </span>
        <div class="greet-text">
          <h2 class="greet-title">{{ greeting }}</h2>
          <p class="greet-sub">{{ dateText }}</p>
        </div>
        <div class="greet-clock" role="timer" aria-live="off" dir="ltr">
          <span
            v-for="(c, i) in timeChars"
            :key="`${i}${c}`"
            :class="{ digit: /\d/.test(c) }"
            >{{ c }}</span
          >
        </div>
      </template>
    </section>
  </div>
</template>

<script lang="ts" setup>
import type { DayPeriod } from "~/components/GreetingIcon.vue";

// On every signed-in page: a greeting for the time of day in Egypt, today's date, and a live clock.
const { t } = useI18n();
const { user } = storeToRefs(useAuthStore());
const { dateLocale } = useDateLabels();

const TZ = "Africa/Cairo";
const PERIOD_COLOR: Record<DayPeriod, string> = {
  morning: "#F59E0B",
  afternoon: "#EAB308",
  evening: "#F97316",
  night: "#818CF8",
};

// null until mounted: the server and the first client render match, then the clock starts.
const now = ref<Date | null>(null);
let timer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  now.value = new Date();
  timer = setInterval(() => (now.value = new Date()), 1000);
});

onBeforeUnmount(() => clearInterval(timer));

/** The hour (0-23) in Egypt, whatever the device's own time zone is. */
const egyptHour = computed(() => {
  if (!now.value) return 0;
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone: TZ,
  }).formatToParts(now.value);
  return Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
});

const period = computed<DayPeriod>(() => {
  const h = egyptHour.value;
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
});

// The sign-up name; older sessions have none, so fall back to the part of the email before "@".
const name = computed(
  () => user.value?.name?.trim() || user.value?.email.split("@")[0] || "",
);
const greeting = computed(() =>
  t("greet_line", { greeting: t(`greet_${period.value}`), name: name.value }),
);

const dateText = computed(() =>
  now.value
    ? new Intl.DateTimeFormat(dateLocale.value, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: TZ,
      }).format(now.value)
    : "",
);

const timeChars = computed(() =>
  now.value
    ? [
        ...new Intl.DateTimeFormat(dateLocale.value, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZone: TZ,
        }).format(now.value),
      ]
    : [],
);
</script>