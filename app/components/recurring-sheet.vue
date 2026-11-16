<template>
  <VSheet :title="heading" @close="store.close()">
    <template v-if="view !== 'list'" #lead>
      <VIconButton :icon="backIcon" :label="t('back')" @click="store.openList()" />
    </template>

    <!-- List: what is waiting, then every rule -->
    <template v-if="view === 'list'">
      <p v-if="!store.rules.length" class="field-hint rec-empty">{{ t("recurring_empty") }}</p>

      <section v-if="store.waiting.length" class="rec-block" :aria-label="t('recurring_upcoming')">
        <h3 class="rec-h">{{ t("recurring_upcoming") }}</h3>
        <ul class="cat-list">
          <li v-for="r in store.waiting" :key="r.id" class="cat-item">
            <span class="row-icon" :style="{ '--c': info(r.cat).color }"><app-icon :name="info(r.cat).icon" /></span>
            <div class="row-text">
              <div class="row-title">{{ r.title }}</div>
              <div class="row-cat" :class="{ 'is-over': status(r) === 'overdue' }">
                <app-icon v-if="status(r) !== 'upcoming'" name="alert" class="rec-ico" />{{ dueText(r) }}
              </div>
            </div>
            <VButton @click="store.openConfirm(r)">{{ t("review") }}</VButton>
          </li>
        </ul>
      </section>

      <section v-if="store.rules.length" class="rec-block" :aria-label="t('recurring_rules')">
        <h3 class="rec-h">{{ t("recurring_rules") }}</h3>
        <ul class="cat-list">
          <li v-for="r in store.rules" :key="r.id" class="cat-item" :class="{ 'rec-paused': !r.active }">
            <span class="row-icon" :style="{ '--c': info(r.cat).color }"><app-icon :name="info(r.cat).icon" /></span>
            <div class="row-text">
              <div class="row-title">{{ r.title }} · {{ formatNumber(r.amount) }} {{ t("currency") }}</div>
              <div class="row-cat">
                {{ repeatText(r) }}<template v-if="!r.active"> · {{ t("recurring_paused") }}</template
                ><template v-else-if="!r.nextDue"> · {{ t("recurring_finished") }}</template>
              </div>
            </div>
            <VIconButton
              :icon="r.active ? 'pause' : 'play'"
              :label="`${t(r.active ? 'recurring_pause' : 'recurring_resume')}: ${r.title}`"
              :disabled="!!store.busy"
              @click="store.setActive(r, !r.active)"
            />
            <VIconButton icon="pencil" :label="`${t('recurring_edit')}: ${r.title}`" @click="store.openForm(r)" />
          </li>
        </ul>
      </section>

      <VError v-if="store.error" sheet role="alert">{{ t(store.error) }}</VError>
      <VButton block @click="store.openForm()"><app-icon name="plus" />{{ t("recurring_add") }}</VButton>
    </template>

    <!-- Confirm one occurrence: the amount can differ from the rule's -->
    <form v-else-if="view === 'confirm' && confirmRule" novalidate @submit.prevent="submitConfirm">
      <p class="rec-lead">
        <b>{{ confirmRule.title }}</b> — {{ dueText(confirmRule) }}
      </p>
      <div class="amount" :class="{ 'has-error': amountError }">
        <label class="sr-only" for="rec-confirm-amount">{{ t("amount") }}</label>
        <div class="amount-row">
          <input
            id="rec-confirm-amount"
            v-model="amountText"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            :style="{ '--len': Math.max(1, amountText.length) }"
            :aria-invalid="amountError"
            @input="amountText = cleanAmount(amountText)"
          />
          <span class="amount-cur">{{ t("currency") }}</span>
        </div>
        <VError v-if="amountError">{{ t("amount_required") }}</VError>
      </div>
      <p class="field-hint">{{ t("recurring_confirm_hint") }}</p>
      <VError v-if="store.error" sheet role="alert">{{ t(store.error) }}</VError>
      <VButton block type="submit" :disabled="!!store.busy" :busy="store.busy === 'confirm'">
        {{ store.busy === "confirm" ? t("adding") : t("recurring_confirm") }}
      </VButton>
      <VButton variant="text" :disabled="!!store.busy" :busy="store.busy === 'skip'" @click="skipOne">
        {{ t("recurring_skip") }}
      </VButton>
    </form>

    <!-- Form: add or edit a rule -->
    <form v-else-if="view === 'form'" novalidate @submit.prevent="submitForm">
      <VTextField id="rec-title" v-model="title" :label="t('recurring_title')" type="text" maxlength="60" autocomplete="off" :placeholder="t('recurring_title_placeholder')" />

      <div class="amount field-block" :class="{ 'has-error': amountError }">
        <label class="sr-only" for="rec-amount">{{ t("amount") }}</label>
        <div class="amount-row">
          <input
            id="rec-amount"
            v-model="amountText"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            placeholder="0"
            :style="{ '--len': Math.max(1, amountText.length) }"
            :aria-invalid="amountError"
            @input="amountText = cleanAmount(amountText)"
          />
          <span class="amount-cur">{{ t("currency") }}</span>
        </div>
        <VError v-if="amountError">{{ t("amount_required") }}</VError>
      </div>

      <div class="chips field-block" role="radiogroup" :aria-label="t('category')">
        <VChip v-for="c in categories.all" :key="c.key" :icon="c.icon" :selected="cat === c.key" @click="cat = c.key">
          {{ info(c.key).label }}
        </VChip>
      </div>

      <div class="field-block">
        <span id="rec-freq" class="field-label">{{ t("recurring_repeats") }}</span>
        <div class="chips" role="radiogroup" aria-labelledby="rec-freq">
          <VChip v-for="f in FREQ_LIST" :key="f" :selected="frequency === f" @click="frequency = f">{{ t(`freq_${f}`) }}</VChip>
        </div>
      </div>

      <div class="field-block rec-every">
        <label class="field-label" for="rec-interval">{{ t("recurring_every") }}</label>
        <div class="field">
          <input id="rec-interval" v-model.number="interval" class="rec-num" type="number" min="1" :max="MAX_INTERVAL[frequency]" inputmode="numeric" dir="ltr" />
          <span>{{ t(`unit_${frequency}`) }}</span>
        </div>
      </div>

      <div class="field-block">
        <span class="field-label">{{ t("recurring_starts") }}</span>
        <label class="field field-date">
          <app-icon name="calendar" />
          <span class="field-value">{{ isoLabel(startDate) }}</span>
          <input v-model="startDate" type="date" class="date-native" :aria-label="t('recurring_starts')" @click="openPicker" />
        </label>
      </div>

      <div class="field-block">
        <span class="field-label">{{ t("recurring_ends") }}</span>
        <label class="field field-date" :class="{ 'is-set': endDate }">
          <app-icon name="calendar" />
          <span class="field-value">{{ endDate ? isoLabel(endDate) : t("recurring_never") }}</span>
          <input v-model="endDate" type="date" class="date-native" :min="startDate" :aria-label="t('recurring_ends')" @click="openPicker" />
        </label>
        <VButton v-if="endDate" variant="text" @click="endDate = ''">{{ t("recurring_never") }}</VButton>
      </div>

      <div class="field-block">
        <span id="rec-remind" class="field-label">{{ t("recurring_remind") }}</span>
        <div class="chips" role="radiogroup" aria-labelledby="rec-remind">
          <VChip v-for="d in REMIND_OPTIONS" :key="d" :selected="remind === d" @click="remind = d">
            {{ d === 0 ? t("remind_on_day") : t("remind_days_before", { n: d }) }}
          </VChip>
        </div>
      </div>

      <VButton variant="text" class="more-toggle" :class="{ 'is-open': showMore }" :aria-expanded="showMore" @click="showMore = !showMore">
        {{ t("more_details") }}<app-icon name="chevronDown" />
      </VButton>
      <template v-if="showMore">
        <div class="field-block">
          <VTextField id="rec-note" v-model="note" :label="t('note')" type="text" maxlength="80" autocomplete="off" :placeholder="t('note_placeholder')" />
        </div>
        <div class="field-block">
          <VTextField id="rec-merchant" v-model="merchant" :label="t('merchant')" type="text" maxlength="60" autocomplete="off" />
        </div>
        <div class="field-block">
          <span id="rec-pay" class="field-label">{{ t("payment_method") }}</span>
          <payment-method-picker v-model="paymentMethod" labelledby="rec-pay" />
        </div>
      </template>

      <VError v-if="formError" sheet role="alert">{{ t(formError) }}</VError>
      <VError v-else-if="store.error" sheet role="alert">{{ t(store.error) }}</VError>
      <VButton block type="submit" :disabled="!!store.busy || !categories.all.length" :busy="store.busy === 'save'">
        {{ store.busy === "save" ? t("saving") : t("save") }}
      </VButton>
      <VButton v-if="editing" variant="text" danger :disabled="!!store.busy" :busy="store.busy === 'delete'" @click="removeRule">
        {{ t("delete") }}
      </VButton>
      <p v-if="editing" class="field-hint">{{ t("recurring_delete_hint") }}</p>
    </form>
  </VSheet>
</template>

<script lang="ts" setup>
import type { PaymentMethod } from "#shared/utils/payment";
import { FREQUENCIES, isValidISODate, type Frequency } from "#shared/utils/recurrence";

const { t, locale } = useI18n();
const store = useRecurringStore();
const categories = useCategoriesStore();
const { info } = useCategoryInfo();
const { isoLabel } = useDateLabels();
const { todayISO } = useExpensesStore();

const FREQ_LIST = FREQUENCIES;
const REMIND_OPTIONS = [0, 1, 3, 7];
const MAX_INTERVAL: Record<Frequency, number> = { daily: 365, weekly: 52, monthly: 24, yearly: 10 };

const view = computed(() => store.sheet?.view ?? "list");
const backIcon = computed<IconName>(() => (locale.value === "ar" ? "arrowRight" : "arrowLeft"));

// The sheet's state is read once per view: the form and confirm views are re-created when it changes (the key below is the view).
const formRule = computed(() => (store.sheet?.view === "form" ? store.sheet.rule : undefined));
const confirmRule = computed(() => (store.sheet?.view === "confirm" ? store.sheet.rule : undefined));
const editing = computed(() => !!formRule.value);

const heading = computed(() =>
  view.value === "confirm" ? t("recurring_review") : view.value === "form" ? t(editing.value ? "recurring_edit" : "recurring_add") : t("recurring"),
);

const { status, dueText, repeatText } = useRecurringText();

// ---- amount typing (Arabic-Indic digits accepted, like the expense form)
function cleanAmount(v: string) {
  const latin = v
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[٫,]/g, ".")
    .replace(/[^0-9.]/g, "");
  const [int = "", ...rest] = latin.split(".");
  return rest.length ? `${int}.${rest.join("")}` : int;
}
const openPicker = (ev: Event) => (ev.target as HTMLInputElement).showPicker?.();

// ---- form state (prefilled when editing, or from the rule being confirmed)
const title = ref("");
const amountText = ref("");
const amountError = ref(false);
const cat = ref("");
const frequency = ref<Frequency>("monthly");
const interval = ref(1);
const startDate = ref(todayISO);
const endDate = ref("");
const remind = ref(1);
const note = ref("");
const merchant = ref("");
const paymentMethod = ref<PaymentMethod | null>(null);
const showMore = ref(false);
const formError = ref("");

/** (Re)fill the fields for the view that just opened: the rule being edited or confirmed, or a blank new one. */
function init() {
  const r0 = formRule.value ?? confirmRule.value;
  title.value = r0?.title ?? "";
  amountText.value = r0 ? String(r0.amount) : "";
  amountError.value = false;
  cat.value = categories.byKey(r0?.cat ?? categories.all[0]?.key ?? "other").key;
  frequency.value = r0?.frequency ?? "monthly";
  interval.value = r0?.interval ?? 1;
  startDate.value = r0?.startDate ?? todayISO;
  endDate.value = r0?.endDate ?? "";
  remind.value = r0?.remindDaysBefore ?? 1;
  note.value = r0?.note ?? "";
  merchant.value = r0?.merchant ?? "";
  paymentMethod.value = r0?.paymentMethod ?? null;
  showMore.value = !!(r0?.note || r0?.merchant || r0?.paymentMethod);
  formError.value = "";
}
init();
watch(() => store.sheet, init);

async function submitForm() {
  formError.value = "";
  const value = Number(amountText.value);
  amountError.value = !(value > 0);
  if (!title.value.trim()) return void (formError.value = "recurring_title_required");
  if (amountError.value) return;
  if (!isValidISODate(startDate.value)) return void (formError.value = "recurring_date_invalid");
  const every = Number.isInteger(interval.value) ? interval.value : 0;
  if (every < 1 || every > MAX_INTERVAL[frequency.value]) return void (formError.value = "recurring_interval_invalid");

  const ok = await store.save(
    {
      title: title.value,
      amount: value,
      cat: cat.value,
      note: note.value,
      merchant: merchant.value,
      paymentMethod: paymentMethod.value,
      frequency: frequency.value,
      interval: every,
      startDate: startDate.value,
      endDate: endDate.value,
      remindDaysBefore: remind.value,
    },
    formRule.value?.id,
  );
  if (ok) {
    useToastStore().show({ text: t(editing.value ? "recurring_updated" : "recurring_added") });
    store.openList();
  }
}

async function removeRule() {
  if (formRule.value && (await store.remove(formRule.value.id))) {
    useToastStore().show({ text: t("recurring_deleted") });
    store.openList();
  }
}

// ---- confirm
async function submitConfirm() {
  const value = Number(amountText.value);
  amountError.value = !(value > 0);
  if (amountError.value || !confirmRule.value) return;
  if (await store.confirm(confirmRule.value, value)) store.openList();
}
async function skipOne() {
  if (confirmRule.value && (await store.skip(confirmRule.value))) store.openList();
}

// Esc closes; body doesn't scroll behind the sheet.
const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && store.close();
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
.rec-block {
  margin-bottom: 16px;
}
.rec-h {
  margin: 0 0 8px;
  padding-inline: 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-2);
}
.rec-empty {
  margin-bottom: 16px;
}
.rec-lead {
  margin: 0 0 12px;
  text-align: center;
}
.rec-ico {
  width: 14px;
  height: 14px;
  margin-inline-end: 4px;
  vertical-align: -2px;
}
.rec-paused {
  opacity: 0.6;
}
.rec-num {
  flex: 1;
  min-width: 0;
  background: none;
  border: 0;
  outline: 0;
  color: inherit;
  font: inherit;
}
</style>
