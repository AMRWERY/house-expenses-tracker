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

const openAdd = () => { saveError.value = ''; sheet.value = { mode: 'add' } }
const openEdit = (expense: Expense) => { saveError.value = ''; sheet.value = { mode: 'edit', expense } }
const close = () => (sheet.value = null)

// The server must accept a change before the sheet closes; if it doesn't, the sheet stays open with a message.
const saveError = ref('')
async function onSave(draft: ExpenseDraft) {
  saveError.value = ''
  try {
    await save(draft, sheet.value?.expense?.id)
    close()
  } catch {
    saveError.value = t('save_failed')
  }
}
async function onDelete() {
  saveError.value = ''
  try {
    if (sheet.value?.expense) await remove(sheet.value.expense.id)
    close()
  } catch {
    saveError.value = t('save_failed')
  }
}
</script>

<template>
  <div class="app">
    <AppHeader>
      <template #actions>
        <!-- Hidden on an empty month: the empty state already has its own "Add expense" button. -->
        <button v-if="items.length" class="btn add-desktop" @click="openAdd">
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
        :error="saveError"
        :date-locale="dateLocale"
        @close="close"
        @save="onSave"
        @delete="onDelete"
      />
    </Transition>
  </div>
</template>
