<script setup>
import { watch } from 'vue';
import confetti from 'canvas-confetti';

const props = defineProps({
  active: {
    type: Boolean,
    default: false,
  },
});

function fire() {
  const base = {
    spread: 72,
    ticks: 210,
    gravity: 0.82,
    scalar: 1,
    colors: ['#ffffff', '#ffd166', '#7ec8e3', '#79cfa0', '#f3a6bd'],
  };

  confetti({ ...base, particleCount: 110, origin: { x: 0.25, y: 0.35 } });
  confetti({ ...base, particleCount: 110, origin: { x: 0.75, y: 0.35 } });
  setTimeout(() => confetti({ ...base, particleCount: 80, origin: { x: 0.5, y: 0.2 } }), 280);
}

watch(
  () => props.active,
  (active) => {
    if (active) fire();
  },
);

defineExpose({ fire });
</script>

<template>
  <span aria-hidden="true"></span>
</template>
