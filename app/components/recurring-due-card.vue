<template>
  <section v-if="due.length" class="due rise" :aria-label="t('recurring_due_title')">
    <h2 class="due-h"><app-icon name="bell" />{{ t("recurring_due_title") }}</h2>
    <ul class="cat-list">
      <li v-for="r in due" :key="r.id" class="cat-item">
        <span class="row-icon" :style="{ '--c': info(r.cat).color }"><app-icon :name="info(r.cat).icon" /></span>
        <div class="row-text">
          <div class="row-title">{{ r.title }} · {{ formatNumber(r.amount) }} {{ t("currency") }}</div>
          <div class="row-cat" :class="{ 'is-over': status(r) === 'overdue' }">{{ dueText(r) }}</div>
        </div>
        <VButton @click="store.openConfirm(r)">{{ t("review") }}</VButton>
      </li>
    </ul>
  </section>
</template>

<script lang="ts" setup>
const { t } = useI18n();
const store = useRecurringStore();
const { due } = storeToRefs(store);
const { info } = useCategoryInfo();
const { status, dueText } = useRecurringText();
</script>

<style scoped>
.due {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow);
}
.due-h {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
}
</style>
