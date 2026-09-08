<template>
  <main class="presenter-view" :class="{ 'presenter-view--intro': !started }">
    <ParticleBackground variant="THIEU_NHI" :intensity="randomRunning ? 1.6 : 0.95" :reduce-motion="settings.reduceMotion" />

    <section v-if="!started" class="presenter-intro">
      <OrganizationLogo class="intro-logo" :src="organization.profile.logoUrl" />
      <span>{{ organization.profile.name }}</span>
      <strong>{{ organization.profile.parishName }}</strong>
      <span v-if="organization.profile.diocese">{{ organization.profile.diocese }}</span>
      <h1>Xé Túi Mù</h1>
      <p>Nhận Lớp Giáo Lý</p>
      <span>Niên khóa {{ organization.profile.academicYear }}</span>
      <span v-if="organization.profile.slogan">{{ organization.profile.slogan }}</span>
      <div class="presenter-intro-actions">
        <button class="text-button text-button--primary" type="button" @click="startPresenter">
          <Play :size="20" />
          Bắt đầu
        </button>
      </div>
    </section>

    <section v-else class="presenter-board">
      <div class="presenter-toolbar">
        <button class="text-button text-button--primary" type="button" :disabled="randomRunning" @click="chooseRandom">
          <Shuffle :size="18" />
          Chọn túi mù ngẫu nhiên
        </button>
        <label class="toggle-row">
          <input
            type="checkbox"
            :checked="settings.randomOnlyUnrevealed"
            @change="settings.patchSetting('randomOnlyUnrevealed', $event.target.checked)"
          />
          <span>Chỉ chọn túi chưa mở</span>
        </label>
        <label class="toggle-row">
          <input
            type="checkbox"
            :checked="settings.allowReReveal"
            @change="settings.patchSetting('allowReReveal', $event.target.checked)"
          />
          <span>Cho phép mở lại</span>
        </label>
        <button class="text-button text-button--danger" type="button" @click="resetReveals">
          <RefreshCcw :size="18" />
          Reset
        </button>
        <select v-model="selectedDivision" class="division-select" title="Lọc theo ngành">
          <option value="">Tất cả ngành</option>
          <option v-for="division in divisions" :key="division.key" :value="division.key">
            {{ division.label }}
          </option>
        </select>

        <div class="presenter-actions">
          <RouterLink class="icon-button" to="/setup" title="Setup">
            <Settings :size="20" />
          </RouterLink>
          <button class="icon-button" type="button" :title="settings.showClassNames ? 'Ẩn tên lớp' : 'Hiện tên lớp'" @click="settings.toggle('showClassNames')">
            <Eye v-if="settings.showClassNames" :size="20" />
            <EyeOff v-else :size="20" />
          </button>
          <button class="icon-button" type="button" :title="settings.soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'" @click="settings.toggle('soundOn')">
            <Volume2 v-if="settings.soundOn" :size="20" />
            <VolumeX v-else :size="20" />
          </button>
          <button class="icon-button" type="button" :title="settings.reduceMotion ? 'Motion đầy đủ' : 'Reduce motion'" @click="settings.toggle('reduceMotion')">
            <Activity :size="20" />
          </button>
          <FullscreenButton />
        </div>
      </div>

      <BlindBagGrid
        :classes="filteredClasses"
        :show-class-names="settings.showClassNames"
        :selected-id="highlightedId"
        @select="goReveal"
      />
    </section>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Activity,
  Eye,
  EyeOff,
  Play,
  RefreshCcw,
  Settings,
  Shuffle,
  Volume2,
  VolumeX,
} from 'lucide-vue-next';
import BlindBagGrid from '@/components/BlindBagGrid.vue';
import FullscreenButton from '@/components/FullscreenButton.vue';
import ParticleBackground from '@/components/ParticleBackground.vue';
import OrganizationLogo from '@/components/OrganizationLogo.vue';
import { useSound } from '@/composables/useSound';
import { DIVISION_OPTIONS } from '@/data/divisions';
import { useClassesStore } from '@/stores/classes';
import { useSettingsStore } from '@/stores/settings';
import { useOrganizationStore } from '@/stores/organization';

const router = useRouter();
const classesStore = useClassesStore();
const settings = useSettingsStore();
const organization = useOrganizationStore();
const { play } = useSound();
const divisions = DIVISION_OPTIONS;
// Đọc/ghi qua settings store (không lưu localStorage) thay vì ref cục bộ, để
// quay lại từ Reveal (route mới, component mount lại) vẫn giữ trạng thái đã
// bắt đầu thay vì bắt bấm "Bắt đầu" lại.
const started = computed({
  get: () => settings.presenterStarted,
  set: (value) => {
    settings.presenterStarted = value;
  },
});
const randomRunning = ref(false);
const highlightedId = ref('');
const selectedDivision = ref('');
let randomTimer;

const filteredClasses = computed(() => {
  if (!selectedDivision.value) return classesStore.orderedClasses;
  return classesStore.orderedClasses.filter((item) => item.division === selectedDivision.value);
});

onMounted(() => {
  classesStore.init();
  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  clearInterval(randomTimer);
  window.removeEventListener('keydown', onKeydown);
});

function startPresenter() {
  started.value = true;
  play('magic');
}

function goReveal(classItem) {
  if (classItem.revealed && !settings.allowReReveal) return;
  router.push(`/reveal/${classItem.id}`);
}

function chooseRandom() {
  const candidates = classesStore
    .revealCandidates(settings.randomOnlyUnrevealed)
    .filter((item) => !selectedDivision.value || item.division === selectedDivision.value);
  if (!candidates.length || randomRunning.value) return;

  randomRunning.value = true;
  play('magic');

  let ticks = 0;
  clearInterval(randomTimer);
  randomTimer = setInterval(() => {
    const item = candidates[Math.floor(Math.random() * candidates.length)];
    highlightedId.value = item.id;
    ticks += 1;

    if (ticks > 28) {
      clearInterval(randomTimer);
      highlightedId.value = candidates[Math.floor(Math.random() * candidates.length)].id;
      randomRunning.value = false;
      play('success');
    }
  }, 95);
}

async function resetReveals() {
  if (!confirm('Bạn có chắc muốn đưa tất cả túi về trạng thái chưa mở?')) return;
  await classesStore.resetReveals();
  highlightedId.value = '';
}

function onKeydown(event) {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName)) return;

  if (event.code === 'Space') {
    event.preventDefault();
    const selected = classesStore.byId(highlightedId.value);
    if (selected) goReveal(selected);
    else chooseRandom();
  } else if (event.key.toLowerCase() === 's') {
    settings.toggle('soundOn');
  } else if (event.key.toLowerCase() === 'f') {
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  }
}

</script>
