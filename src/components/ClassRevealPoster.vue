<template>
  <article ref="posterNode" class="class-poster" :class="{ 'class-poster--animated': animated }" :style="posterStyle">
    <img
      class="poster-church"
      :src="illustrationFailed ? (organization.churchImageUrl || ASSETS.church) : meta.asset"
      alt=""
      @error="illustrationFailed = true"
    />
    <div class="poster-scrim"></div>

    <div ref="contentNode" class="poster-content" :style="{ transform: `scale(${contentScale})` }">
      <header class="poster-header">
        <OrganizationLogo class="poster-logo" :src="organization.logoUrl" />
        <div>
          <p>{{ organization.name }}</p>
          <strong>{{ organization.parishName }}</strong>
          <small class="poster-year">Niên khóa {{ organization.academicYear }}</small>
        </div>
      </header>

      <div class="poster-info-panel">
        <section class="poster-class-name">
          <span>Chi Đoàn (Lớp)</span>
          <h1>{{ item.className }}</h1>
          <p>{{ meta.label }}</p>
        </section>

        <section class="poster-photo-row">
          <TeacherPhoto :src="item.teacherImage" :name="item.teacherName" size="medium" />
          <TeacherPhoto
            v-if="item.assistantName || item.assistantImage"
            :src="item.assistantImage"
            :name="item.assistantName"
            size="medium"
          />
        </section>

        <section class="poster-teacher-name">
          <span>Giáo Lý Viên</span>
          <h2>
            <span class="poster-name-line">{{ teacherParts.saintName }}</span>
            <span v-if="teacherParts.fullName" class="poster-name-line">{{ teacherParts.fullName }}</span>
            <template v-if="item.assistantName">
              <span class="poster-name-sep">&amp;</span>
              <span class="poster-name-line">{{ assistantParts.saintName }}</span>
              <span v-if="assistantParts.fullName" class="poster-name-line">{{ assistantParts.fullName }}</span>
            </template>
          </h2>
        </section>

        <p v-if="item.slogan || organization.slogan" class="poster-slogan">{{ item.slogan || organization.slogan }}</p>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import TeacherPhoto from '@/components/TeacherPhoto.vue';
import OrganizationLogo from '@/components/OrganizationLogo.vue';
import { ASSETS, getDivisionMeta, toAssetStyle } from '@/data/divisions';
import { useOrganizationStore } from '@/stores/organization';

const props = defineProps({
  organizationInfo: { type: Object, default: null },
  classItem: {
    type: Object,
    required: true,
  },
  animated: {
    type: Boolean,
    default: false,
  },
});

const posterNode = ref(null);
const contentNode = ref(null);
const contentScale = ref(1);
let resizeObserver;
const organizationStore = useOrganizationStore();
const organization = computed(() => props.organizationInfo || organizationStore.profile);
const illustrationFailed = ref(false);

const item = computed(() => ({
  className: 'Lớp Giáo Lý',
  division: 'THIEU_NHI',
  teacherName: 'Giáo Lý Viên A',
  assistantName: '',
  teacherImage: '',
  assistantImage: '',
  slogan: '',
  primaryColor: '',
  ...props.classItem,
}));

const meta = computed(() => getDivisionMeta(item.value.division));
const posterStyle = computed(() => ({
  ...toAssetStyle(meta.value),
  '--poster-primary': item.value.primaryColor || meta.value.color,
}));

function splitName(fullName) {
  const trimmed = (fullName || '').trim();
  const spaceIndex = trimmed.indexOf(' ');
  if (spaceIndex === -1) return { saintName: trimmed, fullName: '' };
  return { saintName: trimmed.slice(0, spaceIndex), fullName: trimmed.slice(spaceIndex + 1) };
}

const teacherParts = computed(() => splitName(item.value.teacherName));
const assistantParts = computed(() => splitName(item.value.assistantName));

// Keep long organization names and slogans inside the fixed poster format.
function fitContent() {
  const available = posterNode.value?.clientHeight;
  const required = contentNode.value?.scrollHeight;
  if (available && required) contentScale.value = Math.min(1, available / required);
}

onMounted(() => {
  resizeObserver = new ResizeObserver(fitContent);
  resizeObserver.observe(posterNode.value);
  for (const child of contentNode.value.children) resizeObserver.observe(child);
  fitContent();
});
onBeforeUnmount(() => resizeObserver?.disconnect());
watch([item, organization], fitContent, { deep: true, flush: 'post' });

watch(
  () => item.value.division,
  () => {
    illustrationFailed.value = false;
  },
);

defineExpose({ posterNode });
</script>
