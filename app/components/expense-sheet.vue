<template>
  <VSheet :title="title" @close="sheetStore.close()">
      <form novalidate @submit.prevent="submit">
        <!-- Amount -->
        <div class="amount" :class="{ 'has-error': amountError }">
          <label class="sr-only" for="amount">{{ t("amount") }}</label>
          <div class="amount-row">
            <input
              id="amount"
              ref="amountEl"
              v-model="amount"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              placeholder="0"
              :style="{ '--len': Math.max(1, amount.length) }"
              :aria-invalid="amountError"
              :aria-describedby="amountError ? 'amount-err' : undefined"
              @input="onAmountInput"
            />
            <span class="amount-cur">{{ t("currency") }}</span>
          </div>
          <VError v-if="amountError" id="amount-err">
            {{ t("amount_required") }}
          </VError>
        </div>

        <!-- Category chips -->
        <div class="chips" role="radiogroup" :aria-label="t('category')">
          <VChip
            v-for="c in categories.all"
            :key="c.key"
            :icon="c.icon"
            :selected="cat === c.key"
            @click="cat = c.key"
          >
            {{ info(c.key).label }}
          </VChip>
        </div>

        <!-- No categories left (the last one was deleted): an expense needs one, so ask for it first -->
        <div v-if="!categories.all.length" class="chips-empty">
          <p class="cat-note">{{ t("no_categories_hint") }}</p>
          <VButton variant="text" @click="addCategoryFirst">
            {{ t("add_category") }}
          </VButton>
        </div>

        <!-- Date -->
        <div class="field-block">
          <span class="field-label">{{ t("date") }}</span>
          <label class="field field-date">
            <app-icon name="calendar" />
            <span class="field-value">{{ dateLabel }}</span>
            <input
              v-model="date"
              type="date"
              :min="firstDayISO"
              class="date-native"
              :aria-label="t('date')"
              @click="openPicker"
            />
          </label>
        </div>

        <!-- Note -->
        <div class="field-block">
          <VTextField
            id="note"
            v-model="note"
            :label="t('note')"
            type="text"
            maxlength="80"
            :placeholder="t('note_placeholder')"
          />
        </div>

        <VError v-if="saveError" sheet role="alert">
          {{ t(saveError) }}
        </VError>
        <VButton
          block
          type="submit"
          :disabled="!!busy || !categories.all.length"
          :busy="busy === 'save'"
        >
          <!-- Adding a new expense says "Add"; editing one says "Save" -->
          {{
            busy === "save"
              ? t(mode === "edit" ? "saving" : "adding")
              : t(mode === "edit" ? "save" : "add")
          }}
        </VButton>
        <VButton
          v-if="mode === 'edit'"
          variant="text"
          danger
          :disabled="!!busy"
          :busy="busy === 'delete'"
          @click="sheetStore.remove()"
        >
          {{ busy === "delete" ? t("deleting") : t("delete") }}
        </VButton>
      </form>
  </VSheet>
</template>

<script lang="ts" setup>
const { t } = useI18n();

const sheetStore = useSheetStore();
const { saveError, busy } = storeToRefs(sheetStore);
const { todayISO: today, firstDayISO } = useExpensesStore();
const { dateLocale } = useDateLabels();
const categories = useCategoriesStore();
const { info } = useCategoryInfo();

// What the sheet was opened for, captured once: the store clears it on close, while the leave
// animation is still playing. (The page re-creates this component per expense via :key.)
const { mode = "add", expense: e } = sheetStore.sheet ?? {};
const title = mode === "edit" ? t("edit_expense") : t("add_expense");

// Form state (prefilled when editing; sample rows use their translated title as the note)
const amount = ref(e ? String(e.amount) : "");
const cat = ref<string>(categories.byKey(e?.cat ?? "groceries").key); // an unknown/deleted category shows as "other"
const date = ref(e ? toISODate(e.y, e.m, e.day) : today);
const note = ref(e ? (e.titleKey ? t(e.titleKey) : (e.note ?? "")) : "");
const amountError = ref(false);
const amountEl = ref<HTMLInputElement>();

// Accept Arabic-Indic digits, keep digits and one decimal point.
function onAmountInput() {
  const latin = amount.value
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[٫,]/g, ".")
    .replace(/[^0-9.]/g, "");
  const [int = "", ...rest] = latin.split(".");
  amount.value = rest.length ? `${int}.${rest.join("")}` : int;
  if (amountError.value && Number(amount.value) > 0) amountError.value = false;
}

const dateLabel = computed(() => {
  if (date.value === today) return t("today");
  const [y = 0, m = 1, d = 1] = date.value.split("-").map(Number);
  return new Intl.DateTimeFormat(dateLocale.value, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
});

const openPicker = (ev: Event) =>
  (ev.target as HTMLInputElement).showPicker?.();

/** Close this sheet and open the "add category" form instead. */
function addCategoryFirst() {
  const categorySheet = useCategorySheetStore();
  sheetStore.close();
  categorySheet.open();
  categorySheet.startAdd();
}

function submit() {
  const value = Number(amount.value);
  if (!(value > 0)) {
    amountError.value = true;
    amountEl.value?.focus();
    return;
  }
  sheetStore.save({
    amount: value,
    cat: cat.value,
    date: date.value || today,
    note: note.value,
  });
}

// Esc closes; body doesn't scroll behind the sheet.
const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && sheetStore.close();

onMounted(() => {
  window.addEventListener("keydown", onKey);
  document.body.style.overflow = "hidden";
  if (mode === "add") amountEl.value?.focus({ preventScroll: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  document.body.style.overflow = "";
});
</script>