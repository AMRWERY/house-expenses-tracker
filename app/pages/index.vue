<template>
  <div class="app">
    <Header>
      <template #actions>
        <!-- Hidden on an empty month: the empty state already has its own "Add expense" button. -->
        <VButton v-if="monthItems.length" class="add-desktop" @click="sheetStore.openAdd()">
          <app-icon name="plus" />{{ t("add_expense") }}
        </VButton>
      </template>
      <month-switcher />
      <div class="cat-entry">
        <VChip icon="tag" @click="categorySheetStore.open()">
          {{ t("manage_categories") }}
        </VChip>
      </div>
      <category-filter />
      <date-range-filter />
    </Header>

    <main>
      <!-- This month's main amount (or a prompt to set it, e.g. at the start of a new month) -->
      <month-amount-card />

      <!-- Empty only when the whole month is empty; a filter with no matches keeps the page and says so. -->
      <!-- First load: skeleton rows in the same layout -->
      <div v-if="loading" class="layout" aria-busy="true">
        <aside class="summary">
          <div class="total sk-total">
            <span class="sk sk-line" style="width: 40%" /><span
              class="sk sk-line sk-line-lg"
              style="width: 60%"
            />
          </div>
        </aside>
        <div class="list">
          <section class="day">
            <div class="rows">
              <expense-row-skeleton v-for="n in 5" :key="n" />
            </div>
          </section>
        </div>
      </div>
      <empty-state
        v-else-if="!monthItems.length && !pending && !range"
        :key="`e${view.y}-${view.m}`"
      />
      <div v-else class="layout">
        <aside class="summary">
          <total-card />
        </aside>
        <div class="list">
          <p v-if="!items.length" class="filter-empty">
            {{ t(range ? "no_in_range" : "no_filtered") }}
          </p>
          <TransitionGroup name="grp" tag="div">
            <expense-category-group
              v-for="(g, i) in categoryGroups"
              :key="`${view.y}-${view.m}-${g.cat}`"
              :cat="g.cat"
              :total="g.total"
              :share="categoryGroups.length > 1 ? g.share : null"
              :items="g.items"
              :pending="g.pending"
              :index="i + 1"
            />
          </TransitionGroup>
        </div>
      </div>
    </main>

    <fab-button />

    <Transition name="sheet" appear>
      <expense-sheet
        v-if="sheetStore.sheet"
        :key="sheetStore.sheet.expense?.id ?? 'new'"
      />
    </Transition>

    <Transition name="sheet" appear>
      <category-sheet v-if="categorySheetStore.isOpen" />
    </Transition>

    <Transition name="sheet" appear>
      <month-amount-sheet v-if="monthAmount.sheetOpen" />
    </Transition>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();
const expensesStore = useExpensesStore();
const sheetStore = useSheetStore();
const { view, monthItems, items, categoryGroups, loading, pending, range } =
  storeToRefs(expensesStore);

// If the first load didn't finish before the page opened (slow or failed), try again here:
// the page shows skeletons meanwhile instead of a wrongly empty month.
onMounted(() => {
  if (expensesStore.loading)
    Promise.all([
      expensesStore.load(),
      new Promise((r) => setTimeout(r, 1000)),
    ]).catch(() => {});
});

// ?sheet=add|edit opens the Add/Edit sheet on load (used by the preview page).
const route = useRoute();
const categorySheetStore = useCategorySheetStore();
const monthAmount = useMonthAmountStore();
sheetStore.openFromQuery(route.query);
if (route.query.sheet === "categories") categorySheetStore.open();
onBeforeUnmount(() => {
  sheetStore.close();
  categorySheetStore.close();
  monthAmount.closeSheet();
});
</script>