<template>
  <form novalidate @submit.prevent="submit">
    <!-- Name + live preview -->
    <div class="cat-name">
      <span class="row-icon" :style="{ '--c': color }"
        ><app-icon :name="icon"
      /></span>
      <div class="cat-name-field">
        <label class="field-label" for="category-name">{{
          t("category_name")
        }}</label>
        <input
          id="category-name"
          ref="nameEl"
          v-model="name"
          class="field field-input"
          type="text"
          :maxlength="CATEGORY_NAME_MAX"
          :placeholder="t('category_name_placeholder')"
          :aria-invalid="nameError"
          :aria-describedby="nameError ? 'category-name-err' : undefined"
          @input="nameError = false"
        />
      </div>
    </div>
    <p
      v-if="nameError"
      id="category-name-err"
      class="field-error field-error-inline"
    >
      {{ t("category_name_required") }}
    </p>

    <!-- Color -->
    <span class="field-label cat-label">{{ t("category_color") }}</span>
    <div class="swatches" role="radiogroup" :aria-label="t('category_color')">
      <button
        v-for="c in CATEGORY_COLOR_CHOICES"
        :key="c"
        type="button"
        role="radio"
        class="swatch"
        :style="{ '--c': c }"
        :aria-label="c"
        :aria-checked="color === c"
        @click="color = c"
      >
        <app-icon v-if="color === c" name="check" />
      </button>
    </div>

    <!-- Icon -->
    <span class="field-label cat-label">{{ t("category_icon") }}</span>
    <div
      class="icon-choices"
      role="radiogroup"
      :aria-label="t('category_icon')"
    >
      <button
        v-for="i in CATEGORY_ICON_CHOICES"
        :key="i"
        type="button"
        role="radio"
        class="icon-choice"
        :style="{ '--c': color }"
        :aria-label="i"
        :aria-checked="icon === i"
        @click="icon = i"
      >
        <app-icon :name="i" />
      </button>
    </div>

    <!-- Monthly budget (optional): every expense in this category is deducted from it -->
    <label class="field-label cat-label" for="category-budget">{{
      t("category_budget")
    }}</label>
    <div class="field budget-field">
      <input
        id="category-budget"
        v-model="budget"
        class="field-input budget-input"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        dir="ltr"
        placeholder="0"
        :aria-describedby="'category-budget-hint'"
        @input="onBudgetInput"
      />
      <span class="budget-cur">{{ t("currency") }}</span>
    </div>
    <p id="category-budget-hint" class="cat-note">
      {{ t("category_budget_hint") }}
    </p>
    <!-- How much of this month's main amount no category has claimed once this budget is saved -->
    <p
      v-if="freeAfter !== null"
      class="cat-note"
      :class="{ 'is-over': freeAfter < 0 }"
      role="status"
    >
      {{
        t(freeAfter < 0 ? "ma_form_exceeds" : "ma_form_free", {
          amount: formatNumber(Math.abs(freeAfter)),
          month: monthLabel,
        })
      }}
    </p>

    <p v-if="error" class="field-error sheet-error" role="alert">
      {{ t(error) }}
    </p>

    <button
      class="btn btn-block"
      type="submit"
      :disabled="busy"
      :aria-busy="busy"
    >
      {{ busy ? t("saving") : t("save") }}
    </button>

    <button
      v-if="editing"
      class="btn-text danger"
      type="button"
      :disabled="busy"
      @click="confirming = true"
    >
      {{ t("delete_category") }}
    </button>

    <!-- The delete confirmation is its own dialog, centered over the sheet -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="confirming" class="modal-root">
          <div class="backdrop" @click="confirming = false" />
          <div
            class="modal"
            role="alertdialog"
            aria-modal="true"
            :aria-label="t('delete_category')"
          >
            <h2>{{ t("delete_category") }}</h2>
            <p>
              {{
                t(
                  isLast
                    ? "delete_last_category_confirm"
                    : "delete_category_confirm",
                )
              }}
            </p>
            <button
              class="btn-text danger"
              type="button"
              :disabled="busy"
              @click="confirmDelete"
            >
              {{ t("delete") }}
            </button>
            <button class="btn-text" type="button" @click="confirming = false">
              {{ t("cancel") }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </form>
</template>

<script lang="ts" setup>
const { t } = useI18n();

const sheet = useCategorySheetStore();
const { editing, error, busy } = storeToRefs(sheet);
// The last category can be deleted too, with a stronger warning (its expenses have nowhere to move to).
const isLast = computed(() => useCategoriesStore().all.length <= 1);
const { labelOf } = useCategoryInfo();

// Form state, prefilled when editing. (The sheet re-creates this component per category via :key.)
// A default that was never renamed starts with its translated name.
const initial = editing.value;
const initialLabel = initial ? labelOf(initial) : "";
const name = ref(initialLabel);
const color = ref<string>(initial?.color ?? CATEGORY_COLOR_CHOICES[2]);
const icon = ref<IconName>(initial?.icon ?? "tag");
const budget = ref(initial?.budget !== undefined ? String(initial.budget) : "");
const nameError = ref(false);
const confirming = ref(false);

// Accept Arabic-Indic digits, keep digits and one decimal point.
function onBudgetInput() {
  const latin = budget.value
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[٫,]/g, ".")
    .replace(/[^0-9.]/g, "");
  const [int = "", ...rest] = latin.split(".");
  budget.value = rest.length ? `${int}.${rest.join("")}` : int;
}
const nameEl = ref<HTMLInputElement>();

// Budgets are set aside out of the viewed month's main amount: show what stays unclaimed after this change.
const { monthLabel } = useDateLabels();
const { amount: mainAmount, setAside } = storeToRefs(useMonthAmountStore());
const freeAfter = computed(() => {
  if (mainAmount.value === null) return null;
  const typed = budget.value.trim() === "" ? 0 : Number(budget.value);
  const newBudget = Number.isNaN(typed) ? 0 : typed;
  return (
    Math.round(
      (mainAmount.value -
        (setAside.value - (initial?.budget ?? 0) + newBudget)) *
        100,
    ) / 100
  );
});

function submit() {
  if (!name.value.trim()) {
    nameError.value = true;
    nameEl.value?.focus();
    return;
  }
  // An untouched default keeps following the language instead of freezing its current translation.
  const trimmed = name.value.trim();
  const keepDefaultName =
    initial?.defaultKey && !initial.name && trimmed === initialLabel;
  // Empty budget = none; "0" is a real (spent-out) budget.
  const budgetValue =
    budget.value.trim() === "" || Number.isNaN(Number(budget.value))
      ? null
      : Number(budget.value);
  sheet.save({
    name: keepDefaultName ? null : trimmed,
    color: color.value,
    icon: icon.value,
    budget: budgetValue,
  });
}

/** Close the dialog first, then delete (the sheet goes back to the list while it runs). */
function confirmDelete() {
  confirming.value = false;
  sheet.remove();
}

// Esc closes just the dialog, not the sheet behind it.
const onDialogKey = (ev: KeyboardEvent) => {
  if (ev.key === "Escape" && confirming.value) {
    ev.stopImmediatePropagation();
    confirming.value = false;
  }
};

onMounted(() => {
  window.addEventListener("keydown", onDialogKey, true);
  if (!initial) nameEl.value?.focus({ preventScroll: true });
});

onBeforeUnmount(() => window.removeEventListener("keydown", onDialogKey, true));
</script>