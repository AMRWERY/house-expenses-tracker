<template>
  <div class="app">
    <header class="page-head">
      <nuxt-link-locale class="icon-btn" to="/" :aria-label="t('back')">
        <app-icon :name="backIcon" />
      </nuxt-link-locale>
      <h1>{{ t("compare") }}</h1>
    </header>

    <main class="layout">
      <aside class="summary">
        <section class="total stats rise">
          <div class="total-label" style="text-align: center">
            {{ t("monthly_average") }}
          </div>
          <div class="total-amount" style="text-align: center">
            <animated-number :value="average" /><small>{{
              t("currency")
            }}</small>
          </div>
          <div v-if="highest" class="stat">
            <span>{{ t("highest") }}</span
            ><b>{{ monthName(highest.y, highest.m) }}</b>
          </div>
          <div v-if="lowest" class="stat">
            <span>{{ t("lowest") }}</span
            ><b>{{ monthName(lowest.y, lowest.m) }}</b>
          </div>
        </section>
      </aside>

      <section class="list">
        <div class="day">
          <div class="rows">
            <article
              v-for="(m, i) in months"
              :key="m.key"
              class="cmp-row rise"
              :class="{ 'is-current': m.isCurrent }"
              :style="{ '--i': i + 1 }"
            >
              <div class="cmp-top">
                <h2 class="cmp-month">
                  {{ monthName(m.y, m.m)
                  }}<span v-if="m.isCurrent" class="cmp-sofar">{{
                    t("so_far")
                  }}</span>
                </h2>
                <div class="cmp-amount">
                  <animated-number :value="m.total" /> {{ t("currency") }}
                </div>
              </div>

              <div class="cmp-bar" aria-hidden="true">
                <div
                  class="cmp-fill"
                  :class="{ 'is-over': m.left !== null && m.left < 0 }"
                  :style="{ width: m.pct + '%', '--i': i + 1 }"
                />
              </div>

              <!-- The month's main amount, and what was left of it (or how far over) -->
              <div
                v-if="m.amount !== null && m.left !== null"
                class="cmp-main"
                :class="{ over: m.left < 0 }"
              >
                <span>{{
                  t("ma_of", { amount: formatNumber(m.amount) })
                }}</span>
                <b>
                  {{ m.left < 0 ? t("ma_over") : t("ma_left") }}
                  <animated-number :value="Math.abs(m.left)" />
                  {{ t("currency") }}
                </b>
              </div>

              <div class="cmp-meta">
                <span v-if="m.total > 0"
                  >{{ t("top_category") }}: {{ info(m.topCat).label }}</span
                >
                <span v-else />

                <span
                  v-if="m.delta !== null"
                  class="delta"
                  :class="m.delta > 0 ? 'up' : m.delta < 0 ? 'down' : ''"
                  :aria-label="`${deltaText(m.delta)} ${t('vs_prev')}`"
                >
                  <app-icon
                    v-if="m.delta !== 0"
                    :name="m.delta > 0 ? 'arrowUp' : 'arrowDown'"
                  />
                  <animated-number :value="Math.abs(m.delta)" />%
                </span>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script lang="ts" setup>
const { t, locale } = useI18n();

const { monthName } = useDateLabels();
const { info } = useCategoryInfo();
const { months, average, highest, lowest } = storeToRefs(useComparisonStore());
const backIcon = computed<IconName>(() =>
  locale.value === "ar" ? "arrowRight" : "arrowLeft",
);

// Screen-reader text for the change vs the previous month.
const deltaText = (d: number) =>
  d === 0
    ? t("no_change")
    : d > 0
      ? t("increase", { p: d })
      : t("decrease", { p: Math.abs(d) });
</script>