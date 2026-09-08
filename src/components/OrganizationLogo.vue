<template>
  <img :src="failed ? ASSETS.logo : (src || ASSETS.logo)" :alt="alt" @error="failed = true" />
</template>

<script setup>
import { ref, watch } from 'vue';
import { ASSETS } from '@/data/divisions';

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: 'Logo xứ đoàn' },
});
const failed = ref(false);
watch(() => props.src, () => { failed.value = false; });
</script>
