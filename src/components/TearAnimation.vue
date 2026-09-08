<template>
  <div v-if="active" class="tear-animation" :class="`tear-animation--${phase}`" aria-hidden="true">
    <span class="tear-line"></span>
    <span v-for="fragment in 14" :key="fragment" class="paper-fragment" :style="fragmentStyle(fragment)"></span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  phase: {
    type: String,
    default: 'idle',
  },
});

const active = computed(() => ['tear', 'open', 'light', 'poster-enter'].includes(props.phase));

function fragmentStyle(index) {
  const direction = index % 2 === 0 ? 1 : -1;
  return {
    '--x': `${direction * (18 + index * 5)}px`,
    '--y': `${-12 - index * 4}px`,
    '--r': `${direction * (20 + index * 9)}deg`,
    '--delay': `${index * 0.035}s`,
  };
}
</script>
