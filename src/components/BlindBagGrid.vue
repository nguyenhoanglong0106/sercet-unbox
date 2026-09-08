<template>
  <div class="blind-grid">
    <BlindBag
      v-for="(classItem, index) in classes"
      :key="classItem.id"
      :class-item="classItem"
      :index="index"
      :show-class-name="showClassNames"
      :selected="selectedId === classItem.id"
      @select="$emit('select', classItem)"
    />
  </div>
</template>

<script setup>
import BlindBag from '@/components/BlindBag.vue';

defineProps({
  classes: {
    type: Array,
    required: true,
  },
  showClassNames: {
    type: Boolean,
    default: true,
  },
  selectedId: {
    type: String,
    default: '',
  },
});

defineEmits(['select']);
</script>
