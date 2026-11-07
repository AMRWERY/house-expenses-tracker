<script lang="ts" setup>
const { t } = useI18n()
const expensesStore = useExpensesStore()
const sheetStore = useSheetStore()
const { view, items, groups } = storeToRefs(expensesStore)
const { dayLabel } = useDateLabels()

// ?sheet=add|edit opens the Add/Edit sheet on load (used by the preview page).
const route = useRoute()
const categorySheet = useCategorySheetStore()
sheetStore.openFromQuery(route.query)
if (route.query.sheet === 'categories') categorySheet.open()
onBeforeUnmount(() => {
  sheetStore.close()
  categorySheet.close()
})
</script>

<template>
  <div class="app">
    <AppHeader>
      <template #actions>
        <!-- Hidden on an empty month: the empty state already has its own "Add expense" button. -->
        <button v-if="items.length" class="btn add-desktop" @click="sheetStore.openAdd()">
          <AppIcon name="plus" />{{ t('add_expense') }}
        </button>
      </template>
      <MonthSwitcher />
      <div class="cat-entry">
        <button class="chip" type="button" @click="categorySheet.open()">
          <AppIcon name="tag" />{{ t('manage_categories') }}
        </button>
      </div>
    </AppHeader>

    <main>
      <EmptyState v-if="!items.length" :key="`e${view.y}-${view.m}`" />
      <div v-else class="layout">
        <aside class="summary">
          <TotalCard />
        </aside>
        <div class="list">
          <ExpenseDayGroup
            v-for="(g, i) in groups"
            :key="`${view.y}-${view.m}-${g.day}`"
            :label="dayLabel(g.day)"
            :items="g.items"
            :index="i + 1"
          />
        </div>
      </div>
    </main>

    <FabButton />

    <Transition name="sheet" appear>
      <ExpenseSheet v-if="sheetStore.sheet" :key="sheetStore.sheet.expense?.id ?? 'new'" />
    </Transition>

    <Transition name="sheet" appear>
      <CategorySheet v-if="categorySheet.isOpen" />
    </Transition>
  </div>
</template>
