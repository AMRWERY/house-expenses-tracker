<template>
  <section class="day rise" :style="{ '--i': index }">
    <h2 class="day-title">{{ label }}</h2>
    <div class="rows">
      <ExpenseRow
        v-for="e in items"
        :key="e.id"
        :expense="e"
        @select="$emit('select', $event)"
      />
    </div>
  </section>
</template>

<script lang="ts" setup>
defineProps<{ label: string; items: Expense[]; index: number }>();

defineEmits<{ select: [expense: Expense] }>();
</script>