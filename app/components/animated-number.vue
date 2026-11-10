<template>
  <span>{{ formatNumber(shown) }}</span>
</template>

<script lang="ts" setup>
// A number that counts to its value (ease-out) when it first appears and again whenever it changes.
// Reduced motion: it just shows the value.
const props = withDefaults(
  defineProps<{ value: number; duration?: number }>(),
  { duration: 700 },
);

const shown = ref(props.value); // the server renders the final value; the count-up starts once mounted
let raf = 0;

function animate(from: number, to: number) {
  cancelAnimationFrame(raf);
  if (
    from === to ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    shown.value = to;
    return;
  }
  const t0 = performance.now();
  const tick = (now: number) => {
    const p = Math.min(1, (now - t0) / props.duration);
    const eased = 1 - Math.pow(1 - p, 3);
    shown.value =
      p < 1 ? Math.round((from + (to - from) * eased) * 100) / 100 : to;
    if (p < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}

onMounted(() => animate(0, props.value));

watch(
  () => props.value,
  (to) => animate(shown.value, to),
);

onBeforeUnmount(() => cancelAnimationFrame(raf));
</script>