<template>
  <section class="day rise" :style="{ '--i': index }">
    <h2 class="day-title">{{ label }}</h2>
    <div class="rows">
      <template v-for="e in items" :key="e.id">
        <!-- the expense being updated or deleted: only this one is a skeleton -->
        <ExpenseRowSkeleton v-if="e.id === busyId" />
        <ExpenseRow v-else :expense="e" />
      </template>
      <!-- the expense being added: only this one is a skeleton -->
      <ExpenseRowSkeleton v-if="pending" />
    </div>
  </section>
</template>

<script lang="ts" setup>
import type { Expense } from "~/types/utils";

defineProps<{ label: string; items: Expense[]; index: number; pending?: boolean }>();

const { busyId } = storeToRefs(useExpensesStore());
</script>