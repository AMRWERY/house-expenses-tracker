<template>
  <div class="range-row" role="group" :aria-label="t('date_range')">
    <label class="field field-date range-field" :class="{ 'is-set': rangeFrom }">
      <app-icon name="calendar" />
      <span class="range-cap">{{ t("range_from") }}</span>
      <span class="field-value">{{ rangeFrom ? isoLabel(rangeFrom) : "—" }}</span>
      <input
        v-model="rangeFrom"
        type="date"
        class="date-native"
        :min="firstDayISO"
        :max="rangeTo || undefined"
        :aria-label="t('range_from')"
        @click="openPicker"
      />
    </label>

    <label class="field field-date range-field" :class="{ 'is-set': rangeTo }">
      <app-icon name="calendar" />
      <span class="range-cap">{{ t("range_to") }}</span>
      <span class="field-value">{{ rangeTo ? isoLabel(rangeTo) : "—" }}</span>
      <input
        v-model="rangeTo"
        type="date"
        class="date-native"
        :min="rangeFrom || firstDayISO"
        :aria-label="t('range_to')"
        @click="openPicker"
      />
    </label>

    <Transition name="range-clear">
      <VButton v-if="rangeFrom || rangeTo" variant="text" class="range-clear" @click="expensesStore.clearRange()">
        {{ t("range_clear") }}
      </VButton>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();
const expensesStore = useExpensesStore();
const { rangeFrom, rangeTo } = storeToRefs(expensesStore);
const { firstDayISO } = expensesStore;
const { isoLabel } = useDateLabels();

const openPicker = (ev: Event) => (ev.target as HTMLInputElement).showPicker?.();
</script>

<style scoped>
.range-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  padding-inline: 4px;
}
.range-field {
  flex: 1 1 160px;
  min-width: 0;
  height: 44px;
  width: auto;
}
.range-field.is-set {
  border-color: var(--primary);
}
.range-cap {
  flex: none;
  font-size: 13px;
  color: var(--text-2);
}
.range-field .field-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
}
.range-clear {
  flex: none;
}
.range-clear-enter-active,
.range-clear-leave-active {
  transition:
    opacity 0.2s ease-out,
    transform 0.2s ease-out;
}
.range-clear-enter-from,
.range-clear-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
@media (prefers-reduced-motion: reduce) {
  .range-clear-enter-from,
  .range-clear-leave-to {
    transform: none;
  }
}
</style>
