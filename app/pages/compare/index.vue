<script lang="ts" setup>
const { t, locale } = useI18n()

const { monthName } = useDateLabels()
const { months, average, highest, lowest } = storeToRefs(useComparisonStore())
const backIcon = computed<IconName>(() => (locale.value === 'ar' ? 'arrowRight' : 'arrowLeft'))

// Screen-reader text for the change vs the previous month.
const deltaText = (d: number) =>
  d === 0 ? t('no_change') : d > 0 ? t('increase', { p: d }) : t('decrease', { p: Math.abs(d) })
</script>

<template>
  <div class="app">
    <header class="page-head">
      <nuxt-link-locale class="icon-btn" to="/" :aria-label="t('back')">
        <AppIcon :name="backIcon" />
      </nuxt-link-locale>
      <h1>{{ t('compare') }}</h1>
    </header>

    <main class="layout">
      <aside class="summary">
        <section class="total stats rise">
          <div class="total-label" style="text-align: center">{{ t('monthly_average') }}</div>
          <div class="total-amount" style="text-align: center">
            <span>{{ formatNumber(average) }}</span><small>{{ t('currency') }}</small>
          </div>
          <div v-if="highest" class="stat">
            <span>{{ t('highest') }}</span><b>{{ monthName(highest.y, highest.m) }}</b>
          </div>
          <div v-if="lowest" class="stat">
            <span>{{ t('lowest') }}</span><b>{{ monthName(lowest.y, lowest.m) }}</b>
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
                  {{ monthName(m.y, m.m) }}<span v-if="m.isCurrent" class="cmp-sofar">{{ t('so_far') }}</span>
                </h2>
                <div class="cmp-amount">{{ formatNumber(m.total) }} {{ t('currency') }}</div>
              </div>

              <div class="cmp-bar" aria-hidden="true">
                <div class="cmp-fill" :style="{ width: m.pct + '%', '--i': i + 1 }" />
              </div>

              <div class="cmp-meta">
                <span>{{ t('top_category') }}: {{ t(`categories.${m.topCat}`) }}</span>
                <span
                  v-if="m.delta !== null"
                  class="delta"
                  :class="m.delta > 0 ? 'up' : m.delta < 0 ? 'down' : ''"
                  :aria-label="`${deltaText(m.delta)} ${t('vs_prev')}`"
                >
                  <AppIcon v-if="m.delta !== 0" :name="m.delta > 0 ? 'arrowUp' : 'arrowDown'" />
                  {{ Math.abs(m.delta) }}%
                </span>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
