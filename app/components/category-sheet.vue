<template>
  <VSheet :title="heading" @close="sheet.close()">
      <template v-if="view === 'form'" #lead>
        <VIconButton :icon="backIcon" :label="t('back')" @click="sheet.backToList()" />
      </template>

      <!-- List: built-in categories (fixed) then the person's own (editable) -->
      <template v-if="view === 'list'">
        <ul class="cat-list" :aria-busy="!!pending">
          <template v-for="c in categories.all" :key="c.key">
            <!-- the category being updated or deleted: only this one is a skeleton -->
            <li
              v-if="pending && pending.kind !== 'add' && pending.id === c.id"
              class="cat-item"
              aria-hidden="true"
            >
              <span class="sk sk-icon" />
              <div class="row-text">
                <span class="sk sk-line" style="width: 50%" />
              </div>
            </li>
            <li v-else class="cat-item">
              <span class="row-icon" :style="{ '--c': c.color }"
                ><app-icon :name="c.icon"
              /></span>
              <div class="row-text">
                <div class="row-title">{{ info(c.key).label }}</div>
                <!-- Budget left this month (or how far over) -->
                <div
                  v-if="categories.budgets.get(c.key)"
                  class="row-cat"
                  :class="{
                    'is-over': categories.budgets.get(c.key)!.left < 0,
                  }"
                >
                  {{ budgetText(categories.budgets.get(c.key)!) }}
                </div>
              </div>
              <VIconButton
                icon="pencil"
                :label="`${t('edit_category')}: ${info(c.key).label}`"
                @click="sheet.startEdit(c)"
              />
            </li>
          </template>
          <!-- the category being added -->
          <li
            v-if="pending?.kind === 'add'"
            class="cat-item"
            aria-hidden="true"
          >
            <span class="sk sk-icon" />
            <div class="row-text">
              <span class="sk sk-line" style="width: 50%" />
            </div>
          </li>
        </ul>

        <VButton block :disabled="!!pending" @click="sheet.startAdd()">
          <app-icon name="plus" />{{ t("add_category") }}
        </VButton>
      </template>

      <!-- Stays mounted (hidden) while saving, so a failed save returns to what was typed -->
      <category-form
        v-if="view === 'form' || pending"
        v-show="view === 'form'"
        :key="editing?.id ?? 'new'"
      />
  </VSheet>
</template>

<script lang="ts" setup>
const { t, locale } = useI18n();

const sheet = useCategorySheetStore();
const { view, editing, pending } = storeToRefs(sheet);
const categories = useCategoriesStore();
const { info } = useCategoryInfo();

const heading = computed(() =>
  view.value === "list"
    ? t("categories_title")
    : editing.value
      ? t("edit_category")
      : t("add_category"),
);

// "350 EGP left of 1,000" / "Over by 120 EGP"
const budgetText = (b: { budget: number; left: number }) =>
  b.left < 0
    ? t("budget_over", { amount: `${formatNumber(-b.left)} ${t("currency")}` })
    : t("budget_left", {
        amount: `${formatNumber(b.left)} ${t("currency")}`,
        total: formatNumber(b.budget),
      });

// "Back" points toward the inline-start edge, which flips with the language.
const backIcon = computed<IconName>(() =>
  locale.value === "ar" ? "arrowRight" : "arrowLeft",
);

// Esc closes; body doesn't scroll behind the sheet.
const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && sheet.close();

onMounted(() => {
  window.addEventListener("keydown", onKey);
  document.body.style.overflow = "hidden";
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  document.body.style.overflow = "";
});
</script>