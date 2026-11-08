<template>
  <form novalidate @submit.prevent="submit">
    <!-- Name + live preview -->
    <div class="cat-name">
      <span class="row-icon" :style="{ '--c': color }"><AppIcon :name="icon" /></span>
      <div class="cat-name-field">
        <label class="field-label" for="category-name">{{ t("category_name") }}</label>
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
    <p v-if="nameError" id="category-name-err" class="field-error field-error-inline">
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
        <AppIcon v-if="color === c" name="check" />
      </button>
    </div>

    <!-- Icon -->
    <span class="field-label cat-label">{{ t("category_icon") }}</span>
    <div class="icon-choices" role="radiogroup" :aria-label="t('category_icon')">
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
        <AppIcon :name="i" />
      </button>
    </div>

    <!-- Monthly budget (optional): every expense in this category is deducted from it -->
    <label class="field-label cat-label" for="category-budget">{{ t("category_budget") }}</label>
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
    <p id="category-budget-hint" class="cat-note">{{ t("category_budget_hint") }}</p>

    <p v-if="error" class="field-error sheet-error" role="alert">{{ t(error) }}</p>

    <button class="btn btn-block" type="submit" :disabled="busy" :aria-busy="busy">{{ busy && !confirming ? t("saving") : t("save") }}</button>

    <template v-if="editing && canDelete">
      <button v-if="!confirming" class="btn-text danger" type="button" :disabled="busy" @click="confirming = true">
        {{ t("delete_category") }}
      </button>
      <div v-else class="cat-confirm" role="alertdialog" :aria-label="t('delete_category')">
        <p>{{ t("delete_category_confirm") }}</p>
        <button class="btn-text danger" type="button" :disabled="busy" :aria-busy="busy" @click="sheet.remove()">{{ busy ? t("deleting") : t("delete") }}</button>
        <button class="btn-text" type="button" @click="confirming = false">{{ t("cancel") }}</button>
      </div>
    </template>
  </form>
</template>

<script lang="ts" setup>
const { t } = useI18n();

const sheet = useCategorySheetStore();
const { editing, error, busy, canDelete } = storeToRefs(sheet);
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

function submit() {
  if (!name.value.trim()) {
    nameError.value = true;
    nameEl.value?.focus();
    return;
  }
  // An untouched default keeps following the language instead of freezing its current translation.
  const trimmed = name.value.trim();
  const keepDefaultName = initial?.defaultKey && !initial.name && trimmed === initialLabel;
  // Empty budget = none; "0" is a real (spent-out) budget.
  const budgetValue = budget.value.trim() === "" || Number.isNaN(Number(budget.value)) ? null : Number(budget.value);
  sheet.save({
    name: keepDefaultName ? null : trimmed,
    color: color.value,
    icon: icon.value,
    budget: budgetValue,
  });
}

onMounted(() => {
  if (!initial) nameEl.value?.focus({ preventScroll: true });
});
</script>
