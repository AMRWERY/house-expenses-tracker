<template>
  <div class="sheet-root">
    <div class="backdrop" @click="sheetStore.close()" />

    <div class="sheet" role="dialog" aria-modal="true" :aria-label="title">
      <div class="grab" aria-hidden="true" />

      <div class="sheet-head">
        <h2>{{ title }}</h2>
        <button
          class="icon-btn"
          type="button"
          :aria-label="t('close')"
          @click="sheetStore.close()"
        >
          <AppIcon name="x" />
        </button>
      </div>

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
          <p v-if="amountError" id="amount-err" class="field-error">
            {{ t("amount_required") }}
          </p>
        </div>

        <!-- Category chips -->
        <div class="chips" role="radiogroup" :aria-label="t('category')">
          <button
            v-for="c in categories.all"
            :key="c.key"
            type="button"
            role="radio"
            class="chip"
            :aria-checked="cat === c.key"
            @click="cat = c.key"
          >
            <AppIcon :name="c.icon" />
            {{ info(c.key).label }}
          </button>
        </div>

        <!-- Date -->
        <div class="field-block">
          <span class="field-label">{{ t("date") }}</span>
          <label class="field field-date">
            <AppIcon name="calendar" />
            <span class="field-value">{{ dateLabel }}</span>
            <input
              v-model="date"
              type="date"
              class="date-native"
              :aria-label="t('date')"
              @click="openPicker"
            />
          </label>
        </div>

        <!-- Note -->
        <div class="field-block">
          <label class="field-label" for="note">{{ t("note") }}</label>
          <input
            id="note"
            v-model="note"
            class="field field-input"
            type="text"
            maxlength="80"
            :placeholder="t('note_placeholder')"
          />
        </div>

        <p v-if="saveError" class="field-error sheet-error" role="alert">
          {{ t(saveError) }}
        </p>
        <button
          class="btn btn-block"
          type="submit"
          :disabled="!!busy"
          :aria-busy="busy === 'save'"
        >
          <!-- Adding a new expense says "Add"; editing one says "Save" -->
          {{ busy === "save" ? t(mode === "edit" ? "saving" : "adding") : t(mode === "edit" ? "save" : "add") }}
        </button>
        <button
          v-if="mode === 'edit'"
          class="btn-text danger"
          type="button"
          :disabled="!!busy"
          :aria-busy="busy === 'delete'"
          @click="sheetStore.remove()"
        >
          {{ busy === "delete" ? t("deleting") : t("delete") }}
        </button>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();

const sheetStore = useSheetStore();
const { saveError, busy } = storeToRefs(sheetStore);
const { todayISO: today } = useExpensesStore();
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