<template>
  <div class="sheet-root">
    <div class="backdrop" @click="store.closeSheet()" />

    <div class="sheet" role="dialog" aria-modal="true" :aria-label="title">
      <div class="grab" aria-hidden="true" />

      <div class="sheet-head">
        <h2>{{ title }}</h2>
        <button class="icon-btn" type="button" :aria-label="t('close')" @click="store.closeSheet()">
          <AppIcon name="x" />
        </button>
      </div>

      <form novalidate @submit.prevent="submit">
        <div class="amount" :class="{ 'has-error': amountError }">
          <label class="sr-only" for="month-amount">{{ t("amount") }}</label>
          <div class="amount-row">
            <input
              id="month-amount"
              ref="amountEl"
              v-model="amount"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              placeholder="0"
              :style="{ '--len': Math.max(1, amount.length) }"
              :aria-invalid="amountError"
              :aria-describedby="amountError ? 'month-amount-err' : undefined"
              @input="onAmountInput"
            />
            <span class="amount-cur">{{ t("currency") }}</span>
          </div>
          <p v-if="amountError" id="month-amount-err" class="field-error">{{ t("amount_required") }}</p>
        </div>
        <p class="cat-note">{{ t("ma_sheet_hint", { month: monthLabel }) }}</p>

        <p v-if="saveError" class="field-error sheet-error" role="alert">{{ t(saveError) }}</p>
        <button class="btn btn-block" type="submit" :disabled="saving" :aria-busy="saving">
          {{ saving ? t("saving") : t("save") }}
        </button>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();
const { monthLabel } = useDateLabels();

const store = useMonthAmountStore();
const { saving, saveError } = storeToRefs(store);

// Prefilled with the month's current amount when changing it.
const existing = store.amount;
const title = existing === null ? t("ma_sheet_set") : t("ma_sheet_change");
const amount = ref(existing === null ? "" : String(existing));
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

function submit() {
  const value = Number(amount.value);
  if (!(value > 0)) {
    amountError.value = true;
    amountEl.value?.focus();
    return;
  }
  store.save(value);
}

// Esc closes; body doesn't scroll behind the sheet.
const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && store.closeSheet();

onMounted(() => {
  window.addEventListener("keydown", onKey);
  document.body.style.overflow = "hidden";
  amountEl.value?.focus({ preventScroll: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  document.body.style.overflow = "";
});
</script>
