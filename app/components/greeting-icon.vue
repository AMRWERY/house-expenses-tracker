<template>
  <svg
    class="ico gi"
    :class="`gi-${period}`"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <!-- morning: the sun rises over the horizon -->
    <template v-if="period === 'morning'">
      <path d="M22 22H2" />
      <g class="gi-rise">
        <path d="M12 2v8" />
        <path d="m8 6 4-4 4 4" />
        <path d="m4.93 10.93 1.41 1.41" />
        <path d="m19.07 10.93-1.41 1.41" />
        <path d="M2 18h2" />
        <path d="M20 18h2" />
        <path d="M16 18a4 4 0 0 0-8 0" />
      </g>
    </template>

    <!-- afternoon: full sun, rays turning slowly -->
    <template v-else-if="period === 'afternoon'">
      <circle class="gi-pulse" cx="12" cy="12" r="4" />
      <g class="gi-spin">
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </g>
    </template>

    <!-- evening: the sun sinks toward the horizon -->
    <template v-else-if="period === 'evening'">
      <path d="M22 22H2" />
      <g class="gi-set">
        <path d="M12 10V2" />
        <path d="m16 6-4 4-4-4" />
        <path d="m4.93 10.93 1.41 1.41" />
        <path d="m19.07 10.93-1.41 1.41" />
        <path d="M2 18h2" />
        <path d="M20 18h2" />
        <path d="M16 18a4 4 0 0 0-8 0" />
      </g>
    </template>

    <!-- night: a moon that sways, with twinkling stars -->
    <template v-else>
      <path class="gi-sway" d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      <g class="gi-twinkle">
        <path d="M19 3v4" />
        <path d="M17 5h4" />
      </g>
      <g class="gi-twinkle gi-twinkle-b">
        <path d="M5 3v2" />
        <path d="M4 4h2" />
      </g>
    </template>
  </svg>
</template>

<script lang="ts" setup>
export type DayPeriod = "morning" | "afternoon" | "evening" | "night";

defineProps<{ period: DayPeriod }>();
</script>