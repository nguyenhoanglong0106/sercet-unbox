<template>
  <button
    class="blind-bag"
    :class="{
      'blind-bag--hero': hero,
      'blind-bag--revealed': isRevealed,
      'blind-bag--selected': selected,
    }"
    :style="bagStyle"
    type="button"
    :disabled="disabled"
    :title="label"
    @click="$emit('select', classItem)"
  >
    <span class="bag-shadow"></span>
    <span class="bag-body">
      <span class="bag-top"></span>
      <span class="bag-fold bag-fold--left"></span>
      <span class="bag-fold bag-fold--right"></span>
      <span class="bag-shine"></span>
      <OrganizationLogo class="bag-logo" :src="organization.logoUrl" alt="" />
      <span class="bag-title">Túi Mù</span>
      <span class="bag-year">Giáo Lý {{ organization.academicYear }}</span>
      <span class="bag-question">?</span>
      <span class="bag-spark bag-spark--one"></span>
      <span class="bag-spark bag-spark--two"></span>
      <span class="bag-spark bag-spark--three"></span>
      <span v-if="isRevealed" class="bag-check">
        <CheckCircle2 :size="22" />
      </span>
    </span>
    <span class="bag-label">{{ label }}</span>
  </button>
</template>

<script setup>
import { computed } from 'vue';
import { CheckCircle2 } from 'lucide-vue-next';
import { getDivisionMeta, toAssetStyle } from '@/data/divisions';
import OrganizationLogo from '@/components/OrganizationLogo.vue';
import { useOrganizationStore } from '@/stores/organization';

const props = defineProps({
  organizationInfo: { type: Object, default: null },
  classItem: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    default: 0,
  },
  showClassName: {
    type: Boolean,
    default: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  hero: {
    type: Boolean,
    default: false,
  },
  selected: {
    type: Boolean,
    default: false,
  },
  revealed: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['select']);

const organizationStore = useOrganizationStore();
const organization = computed(() => props.organizationInfo || organizationStore.profile);

const meta = computed(() => getDivisionMeta(props.classItem.division));
const isRevealed = computed(() => props.revealed || props.classItem.revealed);
const bagStyle = computed(() => ({
  ...toAssetStyle(meta.value),
  '--bag-color': props.classItem.primaryColor || meta.value.color,
}));

const label = computed(() => {
  if (!props.showClassName) return `Túi Mù ${String(props.index + 1).padStart(2, '0')}`;
  return `Lớp ${props.classItem.className}`;
});

</script>
