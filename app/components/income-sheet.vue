<template>
  <VSheet :title="heading" @close="store.closeSheet()">
    <template v-if="mode === 'form'" #lead>
      <VIconButton :icon="backIcon" :label="t('back')" @click="backToList" />
    </template>

    <!-- List: this month's income and the net balance -->
    <template v-if="mode === 'list'">
      <div class="inc-sum">
        <div class="inc-sum-row">
          <span>{{ t("income_total") }}</span><b>{{ formatNumber(incomeTotal) }} {{ t("currency") }}</b>
        </div>
        <div class="inc-sum-row">
          <span>{{ t("total_expenses") }}</span><b>{{ formatNumber(expenseTotal) }} {{ t("currency") }}</b>
        </div>
        <div class="inc-sum-row inc-net" :class="{ over: net < 0 }">
          <span>{{ t("net_balance") }}</span><b dir="ltr">{{ formatNumber(net) }} {{ t("currency") }}</b>
        </div>
      </div>

      <p v-if="!store.monthIncomes.length" class="field-hint">{{ t("income_empty", { month: monthLabel }) }}</p>
      <ul v-else class="cat-list">
        <li v-for="i in store.monthIncomes" :key="i.id" class="cat-item">
          <span class="row-icon" style="--c: #22c55e"><app-icon name="trendUp" /></span>
          <div class="row-text">
            <div class="row-title">{{ i.note || t(`income_${i.source}`) }}</div>
            <div class="row-cat">{{ t(`income_${i.source}`) }} · {{ dayLabel(i.day, i.y, i.m) }}</div>
          </div>
          <div class="inc-amount">+{{ formatNumber(i.amount) }} {{ t("currency") }}</div>
          <VIconButton icon="pencil" :label="`${t('edit_income')}: ${i.note || t(`income_${i.source}`)}`" @click="startForm(i)" />
        </li>
      </ul>
      <VButton block @click="startForm()"><app-icon name="plus" />{{ t("add_income") }}</VButton>
    </template>

    <!-- Form -->
    <form v-else novalidate @submit.prevent="submit">
      <div class="amount" :class="{ 'has-error': amountError }">
        <label class="sr-only" for="inc-amount">{{ t("amount") }}</label>
        <div class="amount-row">
          <input
            id="inc-amount"
            ref="amountEl"
            v-model="amount"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            placeholder="0"
            :style="{ '--len': Math.max(1, amount.length) }"
            :aria-invalid="amountError"
            @input="amount = cleanAmount(amount)"
          />
          <span class="amount-cur">{{ t("currency") }}</span>
        </div>
        <VError v-if="amountError">{{ t("amount_required") }}</VError>
      </div>

      <div class="chips" role="radiogroup" :aria-label="t('income_source')">
        <VChip v-for="s in SOURCES" :key="s" :selected="source === s" @click="source = s">{{ t(`income_${s}`) }}</VChip>
      </div>

      <div class="field-block">
        <span class="field-label">{{ t("date") }}</span>
        <label class="field field-date">
          <app-icon name="calendar" />
          <span class="field-value">{{ isoLabel(date) }}</span>
          <input v-model="date" type="date" :min="firstDayISO" class="date-native" :aria-label="t('date')" @click="openPicker" />
        </label>
      </div>

      <div class="field-block">
        <VTextField id="inc-note" v-model="note" :label="t('note')" type="text" maxlength="80" :placeholder="t('note_placeholder')" />
      </div>

      <VError v-if="error" sheet role="alert">{{ t(error) }}</VError>
      <VButton block type="submit" :disabled="!!busy" :busy="busy === 'save'">
        {{ busy === "save" ? t(editing ? "saving" : "adding") : t(editing ? "save" : "add") }}
      </VButton>
      <VButton v-if="editing" variant="text" danger :disabled="!!busy" :busy="busy === 'delete'" @click="removeIncome">
        {{ busy === "delete" ? t("deleting") : t("delete") }}
      </VButton>
    </form>
  </VSheet>
</template>

<script lang="ts" setup>
import type { Income } from "~/types/stores/incomeStore";
import { INCOME_SOURCES, type IncomeSource } from "#shared/utils/income";

const { t, locale } = useI18n();
const store = useIncomeStore();
const expensesStore = useExpensesStore();
const { monthLabel, dayLabel, isoLabel } = useDateLabels();
const { todayISO, firstDayISO } = expensesStore;

const SOURCES = INCOME_SOURCES;
const backIcon = computed<IconName>(() => (locale.value === "ar" ? "arrowRight" : "arrowLeft"));

// ---- totals for the viewed month (net balance = income - expenses)
const incomeTotal = computed(() => store.monthIncomes.reduce((s, i) => s + i.amount, 0));
const expenseTotal = computed(() => expensesStore.monthItems.reduce((s, e) => s + e.amount, 0));
const net = computed(() => Math.round((incomeTotal.value - expenseTotal.value) * 100) / 100);

// ---- list <-> form
const mode = ref<"list" | "form">("list");
const editingIncome = ref<Income | null>(null);
const editing = computed(() => !!editingIncome.value);
const heading = computed(() => (mode.value === "list" ? t("income") : t(editing.value ? "edit_income" : "add_income")));

const amount = ref("");
const source = ref<IncomeSource>("salary");
const date = ref(todayISO);
const note = ref("");
const amountError = ref(false);
const amountEl = ref<HTMLInputElement>();
const busy = ref<"save" | "delete" | "">("");
const error = ref("");

function startForm(income?: Income) {
  editingIncome.value = income ?? null;
  amount.value = income ? String(income.amount) : "";
  source.value = income?.source ?? "salary";
  // New income is dated today, or the 1st if another month is being viewed
  const v = expensesStore.view;
  date.value = income
    ? toISODate(income.y, income.m, income.day)
    : v.y === expensesStore.current.y && v.m === expensesStore.current.m
      ? todayISO
      : toISODate(v.y, v.m, 1);
  note.value = income?.note ?? "";
  amountError.value = false;
  error.value = "";
  mode.value = "form";
  nextTick(() => !income && amountEl.value?.focus({ preventScroll: true }));
}
const backToList = () => (mode.value = "list");

function cleanAmount(v: string) {
  const latin = v
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[٫,]/g, ".")
    .replace(/[^0-9.]/g, "");
  const [int = "", ...rest] = latin.split(".");
  return rest.length ? `${int}.${rest.join("")}` : int;
}
const openPicker = (ev: Event) => (ev.target as HTMLInputElement).showPicker?.();

async function run(kind: "save" | "delete", action: () => Promise<void>) {
  if (busy.value) return;
  busy.value = kind;
  error.value = "";
  try {
    await action();
    mode.value = "list";
  } catch {
    error.value = "save_failed";
  } finally {
    busy.value = "";
  }
}

function submit() {
  const value = Number(amount.value);
  amountError.value = !(value > 0);
  if (amountError.value) return amountEl.value?.focus();
  return run("save", () => store.save({ amount: value, source: source.value, date: date.value || todayISO, note: note.value }, editingIncome.value?.id));
}
const removeIncome = () => run("delete", () => store.remove(editingIncome.value!.id));

// Esc closes; body doesn't scroll behind the sheet.
const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && store.closeSheet();
onMounted(() => {
  window.addEventListener("keydown", onKey);
  document.body.style.overflow = "hidden";
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  document.body.style.overflow = "";
});
</script>

<style scoped>
.inc-sum {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--surface-alt);
  border-radius: 16px;
}
.inc-sum-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-block: 4px;
}
.inc-net {
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid var(--border);
  font-weight: 600;
}
.inc-net.over b {
  color: var(--expense);
}
.inc-amount {
  font-weight: 600;
  color: #15803d;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
:root[data-theme="dark"] .inc-amount {
  color: #4ade80;
}
</style>
