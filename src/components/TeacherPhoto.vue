<template>
  <figure class="teacher-photo" :class="`teacher-photo--${size}`">
    <img v-if="resolvedSrc" :src="resolvedSrc" :alt="name || 'Giáo lý viên'" @error="handleError" />
    <span v-else>{{ initials }}</span>
  </figure>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { ASSETS } from '@/data/divisions';
import { guessGenderFromSaintName } from '@/data/saintGenders';

const props = defineProps({
  src: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    default: '',
  },
  // Truyền vào khi đã biết chắc (vd bảng import Excel có cột giới tính); để
  // trống thì đoán theo Tên Thánh trong `name`.
  gender: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'medium',
  },
});

const broken = ref(false);
const fallbackBroken = ref(false);

// Tên Thánh là từ đầu tiên của họ tên, vd "Giuse Nguyễn Hoàng Long" -> "Giuse".
const saintName = computed(() => (props.name || '').trim().split(/\s+/)[0] || '');

// Chưa chọn ảnh riêng thì dùng ảnh GLV mặc định theo giới tính. Không đoán được
// giới tính (tên thánh lạ, bỏ trống) thì quay về hiển thị chữ viết tắt.
const defaultSrc = computed(() => {
  if (fallbackBroken.value) return '';
  const gender = props.gender || guessGenderFromSaintName(saintName.value);
  if (gender === 'NAM') return ASSETS.glvNam;
  if (gender === 'NU') return ASSETS.glvNu;
  return '';
});

const resolvedSrc = computed(() => (props.src && !broken.value ? props.src : defaultSrc.value));

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

watch([() => props.name, () => props.gender], () => {
  fallbackBroken.value = false;
});

function handleError() {
  // Ảnh đang hỏng là ảnh mặc định thì không còn gì để lùi về ngoài chữ viết tắt.
  if (resolvedSrc.value === defaultSrc.value) fallbackBroken.value = true;
  else broken.value = true;
}
</script>
