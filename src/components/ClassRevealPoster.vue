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
        <div class="poster-header-text">
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
          <TeacherPhoto v-if="soloName" :src="soloGlv.image" :name="soloGlv.name" size="medium" />
          <template v-else>
            <TeacherPhoto :src="item.teacherImage" :name="item.teacherName" size="medium" />
            <TeacherPhoto
              v-if="item.assistantName || item.assistantImage"
              :src="item.assistantImage"
              :name="item.assistantName"
              size="medium"
            />
          </template>
        </section>

        <section class="poster-teacher-name">
          <span>Giáo Lý Viên</span>
          <h2 v-if="soloName">
            <span class="poster-name-line">{{ soloParts.saintName }}</span>
            <span v-if="soloParts.fullName" class="poster-name-line">{{ soloParts.fullName }}</span>
          </h2>
          <h2 v-else>
            <span class="poster-name-line">{{ teacherParts.saintName }}</span>
            <span v-if="teacherParts.fullName" class="poster-name-line">{{ teacherParts.fullName }}</span>
            <template v-if="item.assistantName">
              <span class="poster-name-sep">&amp;</span>
              <span class="poster-name-line">{{ assistantParts.saintName }}</span>
              <span v-if="assistantParts.fullName" class="poster-name-line">{{ assistantParts.fullName }}</span>
            </template>
          </h2>
          <p v-if="soloName && hasTwoGlv" class="poster-partner-note">
            Lớp này có 2 Giáo Lý Viên phụ trách — hãy tìm người còn lại nhé!
          </p>
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
import { ASSETS, getDivisionMeta, normalizeForMatch, toAssetStyle } from '@/data/divisions';
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
  // Chế độ Giáo Lý Viên: chỉ hiện đúng GLV vừa tra cứu, giấu tên người còn lại.
  soloName: {
    type: String,
    default: '',
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

const hasTwoGlv = computed(() => Boolean(item.value.teacherName && item.value.assistantName));
const soloGlv = computed(() => {
  const isAssistant =
    normalizeForMatch(item.value.assistantName) &&
    normalizeForMatch(item.value.assistantName) === normalizeForMatch(props.soloName);
  return isAssistant
    ? { name: item.value.assistantName, image: item.value.assistantImage }
    : { name: item.value.teacherName, image: item.value.teacherImage };
});
const soloParts = computed(() => splitName(soloGlv.value.name));

// Keep long organization names and slogans inside the fixed poster format.
function fitContent() {
  const available = posterNode.value?.clientHeight;
  const content = contentNode.value;
  if (!available || !content) return;
  // Panel thông tin giãn kín khung nên phần nội dung tràn bên trong nó không
  // còn được tính vào scrollHeight của content — cộng bù phần dôi ra đó.
  const panel = content.querySelector('.poster-info-panel');
  const panelOverflow = panel ? Math.max(0, panel.scrollHeight - panel.clientHeight) : 0;
  contentScale.value = Math.min(1, available / (content.scrollHeight + panelOverflow));
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
