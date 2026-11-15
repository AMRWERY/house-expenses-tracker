<template>
  <div class="search" role="search">
    <label class="field search-field">
      <app-icon name="search" />
      <span class="sr-only">{{ t("search") }}</span>
      <input
        v-model="searchQuery"
        class="search-input"
        type="search"
        enterkeyhint="search"
        autocomplete="off"
        :placeholder="t('search_placeholder')"
      />
      <button
        v-if="searchQuery"
        type="button"
        class="search-clear"
        :aria-label="t('search_clear')"
        @click="searchQuery = ''"
      >
        <app-icon name="x" />
      </button>
    </label>
    <VIconButton
      icon="sliders"
      :label="t('amount_filter')"
      :aria-expanded="open"
      :class="{ 'is-on': open || minAmount || maxAmount }"
      @click="open = !open"
    />
    <Transition name="range-clear">
      <div v-if="open" class="search-amounts">
        <label class="field search-amount">
          <span class="range-cap">{{ t("amount_min") }}</span>
          <input v-model="minAmount" type="text" inputmode="decimal" dir="ltr" placeholder="0" :aria-label="t('amount_min')" />
        </label>
        <label class="field search-amount">
          <span class="range-cap">{{ t("amount_max") }}</span>
          <input v-model="maxAmount" type="text" inputmode="decimal" dir="ltr" placeholder="∞" :aria-label="t('amount_max')" />
        </label>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();
const { searchQuery, minAmount, maxAmount } = storeToRefs(useExpensesStore());
const open = ref(Boolean(minAmount.value || maxAmount.value));
</script>

<style scoped>
.search {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding-inline: 4px;
}
.search-field {
  flex: 1 1 180px;
  min-width: 0;
  height: 44px;
  width: auto;
}
.search-input,
.search-amount input {
  flex: 1;
  min-width: 0;
  background: none;
  border: 0;
  outline: 0;
  color: inherit;
  font: inherit;
}
.search-input::-webkit-search-cancel-button {
  display: none;
}
.search-clear {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  color: var(--text-2);
}
.search-amounts {
  display: flex;
  flex: 1 1 100%;
  gap: 8px;
}
.search-amount {
  flex: 1;
  height: 44px;
  width: auto;
}
.is-on {
  color: var(--primary);
}
</style>
