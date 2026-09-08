<template>
  <button
    class="icon-button"
    type="button"
    :title="isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'"
    @click="toggle"
  >
    <Minimize2 v-if="isFullscreen" :size="20" />
    <Maximize2 v-else :size="20" />
  </button>
</template>

<script setup>
import { Maximize2, Minimize2 } from 'lucide-vue-next';
import { useFullscreen } from '@/composables/useFullscreen';

const { isFullscreen, toggle } = useFullscreen();
</script>
