<template>
  <div class="countdown" :class="{ 'countdown--visible': value }" aria-live="polite">
    {{ value }}
  </div>
</template>

<script setup>
defineProps({
  value: {
    type: String,
    default: '',
  },
});
</script>
