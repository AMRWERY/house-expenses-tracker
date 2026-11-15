<template>
  <VSheet :title="t('edit_template')" @close="emit('close')">
    <form novalidate @submit.prevent="submit">
      <VTextField id="tpl-name" v-model="name" :label="t('template_name')" type="text" maxlength="40" autocomplete="off" />

      <div class="field-block">
        <VTextField
          id="tpl-amount"
          v-model="amount"
          :label="t('template_amount')"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          dir="ltr"
          :placeholder="t('template_amount_placeholder')"
        />
      </div>

      <div class="chips field-block" role="radiogroup" :aria-label="t('category')">
        <VChip v-for="c in categories.all" :key="c.key" :icon="c.icon" :selected="cat === c.key" @click="cat = c.key">
          {{ info(c.key).label }}
        </VChip>
      </div>

      <div class="field-block">
        <VTextField id="tpl-merchant" v-model="merchant" :label="t('merchant')" type="text" maxlength="60" autocomplete="off" />
      </div>
      <div class="field-block">
        <VTextField id="tpl-note" v-model="note" :label="t('note')" type="text" maxlength="80" autocomplete="off" />
      </div>

      <div class="field-block">
        <span id="tpl-pay" class="field-label">{{ t("payment_method") }}</span>
        <payment-method-picker v-model="paymentMethod" labelledby="tpl-pay" />
      </div>

      <VError v-if="error" sheet role="alert">{{ t(error) }}</VError>
      <VButton block type="submit" :disabled="busy || !name.trim() || !categories.all.length" :busy="busy">
        {{ busy ? t("saving") : t("save") }}
      </VButton>
      <VButton variant="text" danger :disabled="busy" @click="remove">{{ t("delete") }}</VButton>
    </form>
  </VSheet>
</template>

<script lang="ts" setup>
import type { ExpenseTemplate } from "~/types/stores/templatesStore";
import type { PaymentMethod } from "#shared/utils/payment";

const props = defineProps<{ template: ExpenseTemplate }>();
const emit = defineEmits<{ close: [] }>();

const { t } = useI18n();
const store = useTemplatesStore();
const categories = useCategoriesStore();
const { info } = useCategoryInfo();

const tp = props.template;
const name = ref(tp.name);
const amount = ref(tp.amount !== null ? String(tp.amount) : "");
const cat = ref(categories.byKey(tp.cat).key);
const merchant = ref(tp.merchant ?? "");
const note = ref(tp.note ?? "");
const paymentMethod = ref<PaymentMethod | null>(tp.paymentMethod ?? null);
const busy = ref(false);
const error = ref("");

async function run(action: () => Promise<void>) {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    await action();
    emit("close");
  } catch {
    error.value = "save_failed";
  } finally {
    busy.value = false;
  }
}

const submit = () =>
  run(() => {
    // Western digits, "." as the decimal mark
    const typed = normalizeText(amount.value).replace(",", ".");
    const value = typed === "" ? null : Number(typed);
    if (value !== null && !(value > 0)) {
      error.value = "amount_required";
      return Promise.reject(new Error("amount"));
    }
    return store.update(tp.id, {
      name: name.value.trim(),
      amount: value,
      cat: cat.value,
      note: note.value.trim() || undefined,
      merchant: merchant.value.trim() || undefined,
      paymentMethod: paymentMethod.value ?? undefined,
    });
  });
const remove = () => run(() => store.remove(tp.id));

const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && emit("close");
onMounted(() => {
  window.addEventListener("keydown", onKey);
  document.body.style.overflow = "hidden";
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  document.body.style.overflow = "";
});
</script>
