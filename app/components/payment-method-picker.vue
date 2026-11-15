<template>
  <div class="chips" role="radiogroup" :aria-labelledby="labelledby">
    <VChip v-for="p in PAY_METHODS" :key="p" :selected="model === p" @click="model = model === p ? null : p">
      {{ t(`pay_${p}`) }}
    </VChip>
  </div>
</template>

<script lang="ts" setup>
import { PAYMENT_METHODS, type PaymentMethod } from "#shared/utils/payment";

/** Payment method chips. Tap the selected one again to clear it (the field is optional). */
defineProps<{ labelledby: string }>();
const model = defineModel<PaymentMethod | null>({ required: true });
const { t } = useI18n();

const PAY_METHODS = PAYMENT_METHODS;
</script>
