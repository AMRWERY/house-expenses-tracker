<script lang="ts" setup>
useTheme()
const { t } = useI18n()
const route = useRoute()
const { view, monthLabel, items, total, groups, todayISO, dateLocale, save, remove, prev, next } = useExpenses()

// Add/Edit bottom sheet. ?sheet=add|edit opens it on load (used by the preview page).
type SheetState = { mode: 'add' | 'edit'; expense?: Expense } | null
const sheet = ref<SheetState>(
  route.query.sheet === 'add'
    ? { mode: 'add' }
    : route.query.sheet === 'edit' && items.value[0]
      ? { mode: 'edit', expense: items.value[0] }
      : null,
)

const openAdd = () => (sheet.value = { mode: 'add' })
const openEdit = (expense: Expense) => (sheet.value = { mode: 'edit', expense })
const close = () => (sheet.value = null)

function onSave(draft: ExpenseDraft) {
  save(draft, sheet.value?.expense?.id)
  close()
}
function onDelete() {
  if (sheet.value?.expense) remove(sheet.value.expense.id)
  close()
}
</script>

<template>
  <div class="app">
    <AppHeader>
      <template #actions>
        <button class="btn add-desktop" @click="openAdd">
          <AppIcon name="plus" />{{ t('add_expense') }}
        </button>
      </template>
      <MonthSwitcher :label="monthLabel" @prev="prev" @next="next" />
    </AppHeader>

    <main>
      <EmptyState v-if="!items.length" :key="`e${view.y}-${view.m}`" @add="openAdd" />
      <div v-else class="layout">
        <aside class="summary">
          <TotalCard :total="total" />
        </aside>
        <div class="list">
          <ExpenseDayGroup
            v-for="(g, i) in groups"
            :key="`${view.y}-${view.m}-${g.day}`"
            :label="g.label"
            :items="g.items"
            :index="i + 1"
            @select="openEdit"
          />
        </div>
      </div>
    </main>

    <FabButton @click="openAdd" />

    <Transition name="sheet" appear>
      <ExpenseSheet
        v-if="sheet"
        :key="sheet.expense?.id ?? 'new'"
        :mode="sheet.mode"
        :expense="sheet.expense"
        :today="todayISO"
        :date-locale="dateLocale"
        @close="close"
        @save="onSave"
        @delete="onDelete"
      />
    </Transition>
  </div>
</template>
