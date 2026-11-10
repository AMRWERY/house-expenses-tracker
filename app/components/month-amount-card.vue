<template>
  <div v-if="!loading && (amount !== null || canAsk)" class="mamt-wrap">
    <!-- The month's main amount: what's spent comes off it; category budgets are set aside out of it -->
    <section
      v-if="amount !== null"
      class="mamt rise"
      :aria-label="t('ma_title', { month: monthLabel })"
    >
      <div class="mamt-head">
        <div>
          <div class="total-label">
            {{ t("ma_title", { month: monthLabel }) }}
          </div>
          <div class="mamt-value">
            <animated-number :value="amount" /><small>{{
              t("currency")
            }}</small>
          </div>
        </div>
        <VIconButton icon="pencil" :label="t('ma_edit')" @click="store.openSheet()" />
      </div>

      <div class="mamt-stats">
        <div class="mamt-stat">
          <span>{{ t("ma_spent") }}</span>
          <b><animated-number :value="spent" /> {{ t("currency") }}</b>
        </div>
        <div class="mamt-stat" :class="{ over: (left ?? 0) < 0 }">
          <span>{{ (left ?? 0) < 0 ? t("ma_over") : t("ma_left") }}</span>
          <b
            ><animated-number :value="Math.abs(left ?? 0)" />
            {{ t("currency") }}</b
          >
        </div>
      </div>

      <p v-if="setAside > 0" class="mamt-note">
        {{
          t("ma_set_aside", {
            aside: formatNumber(setAside),
            free: formatNumber(Math.max(0, notSetAside ?? 0)),
          })
        }}
      </p>
      <VError v-if="(notSetAside ?? 0) < 0" class="mamt-warn" role="status">
        {{
          t("ma_budgets_exceed", {
            amount: formatNumber(Math.abs(notSetAside ?? 0)),
          })
        }}
      </VError>
    </section>

    <!-- A month without an amount (a new month): ask for it -->
    <section
      v-else
      class="mamt mamt-ask rise"
      :aria-label="t('ma_ask_title', { month: monthLabel })"
    >
      <div class="mamt-ask-text">
        <h2>{{ t("ma_ask_title", { month: monthLabel }) }}</h2>
        <p>{{ t("ma_ask_hint") }}</p>
      </div>
      <VButton @click="store.openSheet()">
        {{ t("ma_set") }}
      </VButton>
    </section>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();
const { monthLabel } = useDateLabels();

const store = useMonthAmountStore();
const { amount, spent, left, setAside, notSetAside, canAsk } =
  storeToRefs(store);
const { loading } = storeToRefs(useExpensesStore());
</script>