<template>
  <div class="field-block receipt">
    <span class="field-label">{{ t("receipt") }}</span>
    <div v-if="has" class="receipt-box">
      <a :href="url" target="_blank" rel="noopener" class="receipt-link" :aria-label="t('receipt_open')">
        <img class="receipt-img" :src="url" :alt="t('receipt')" width="96" height="96" loading="lazy" />
      </a>
      <div class="receipt-actions">
        <VButton variant="text" :disabled="busy" @click="input?.click()"><app-icon name="camera" />{{ t("receipt_replace") }}</VButton>
        <VButton variant="text" danger :disabled="busy" :busy="busy" @click="remove"><app-icon name="trash" />{{ t("receipt_remove") }}</VButton>
      </div>
    </div>
    <VButton v-else variant="text" :disabled="busy" :busy="busy" @click="input?.click()">
      <app-icon name="paperclip" />{{ busy ? t("receipt_uploading") : t("receipt_attach") }}
    </VButton>
    <VError v-if="error" inline role="alert">{{ t(error) }}</VError>
    <input ref="input" class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" tabindex="-1" @change="pick" />
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{ expenseId: number; hasReceipt: boolean }>();
const { t } = useI18n();
const expensesStore = useExpensesStore();

const input = ref<HTMLInputElement>();
const busy = ref(false);
const error = ref("");
const has = ref(props.hasReceipt);
const version = ref(0); // changes the URL after a replace, so the browser fetches the new picture
const url = computed(() => `/api/expenses/${props.expenseId}/receipt?v=${version.value}`);

async function pick(ev: Event) {
  const el = ev.target as HTMLInputElement;
  const file = el.files?.[0];
  el.value = ""; // picking the same file again must still fire
  if (!file || busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    const image = await fileToReceipt(file);
    await $fetch(`/api/expenses/${props.expenseId}/receipt`, { method: "POST", body: { image } });
    has.value = true;
    version.value++;
    expensesStore.setReceipt(props.expenseId, true);
  } catch (e) {
    const msg = (e as { data?: { message?: string }; message?: string })?.data?.message ?? (e as Error)?.message;
    error.value = msg === "invalid_image" ? "invalid_image" : "receipt_failed";
  } finally {
    busy.value = false;
  }
}

async function remove() {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    await $fetch(`/api/expenses/${props.expenseId}/receipt`, { method: "DELETE" });
    has.value = false;
    expensesStore.setReceipt(props.expenseId, false);
  } catch {
    error.value = "receipt_failed";
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.receipt-box {
  display: flex;
  align-items: center;
  gap: 12px;
}
.receipt-img {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid var(--border);
}
.receipt-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
</style>
