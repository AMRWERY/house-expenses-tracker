<template>
  <section class="day rise" :style="{ '--i': index }">
    <h2 class="day-title">{{ label }}</h2>
    <div class="rows">
      <ExpenseRow v-for="e in items" :key="e.id" :expense="e" />
    </div>
  </section>
</template>

<script lang="ts" setup>
import type { Expense } from "~/types/utils";

defineProps<{ label: string; items: Expense[]; index: number }>();
</script>