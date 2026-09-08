<template>
  <figure class="teacher-photo" :class="`teacher-photo--${size}`">
    <img v-if="src" :src="src" :alt="name || 'Giáo lý viên'" @error="handleError" />
    <span v-else>{{ initials }}</span>
  </figure>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  src: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'medium',
  },
});

const broken = ref(false);

const src = computed(() => (broken.value ? '' : props.src));
const initials = computed(() => {
  const words = (props.name || 'GLV').trim().split(/\s+/).slice(-2);
  return words.map((word) => word[0]?.toUpperCase() || '').join('') || 'GLV';
});

watch(
  () => props.src,
  () => {
    broken.value = false;
  },
);

function handleError() {
  broken.value = true;
}
</script>
