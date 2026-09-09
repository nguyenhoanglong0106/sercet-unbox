<template>
  <main class="presenter-view" :class="{ 'presenter-view--intro': !started }">
    <ParticleBackground variant="THIEU_NHI" :intensity="randomRunning ? 1.6 : 0.95" :reduce-motion="settings.reduceMotion" />

    <section v-if="!started" class="presenter-intro" :class="{ 'presenter-intro--glv': mode === 'glv' }">
      <OrganizationLogo class="intro-logo" :src="organization.profile.logoUrl" />
      <span>{{ organization.profile.name }}</span>
      <strong>{{ organization.profile.parishName }}</strong>
      <span v-if="organization.profile.diocese">{{ organization.profile.diocese }}</span>
      <h1>Xé Túi Mù</h1>
      <p>Nhận Lớp Giáo Lý</p>
      <span>Niên khóa {{ organization.profile.academicYear }}</span>
      <span v-if="organization.profile.slogan">{{ organization.profile.slogan }}</span>
      <div v-if="mode !== 'glv'" class="presenter-intro-actions">
        <button class="text-button text-button--primary" type="button" @click="startPresenter">
          <Play :size="20" />
          Thiếu Nhi
        </button>
        <button class="text-button text-button--glv" type="button" @click="openGlvLookup">
          <UserRound :size="20" />
          Giáo Lý Viên
        </button>
      </div>

      <form v-else class="glv-lookup" @submit.prevent="submitGlvLookup">
        <h2>Giáo Lý Viên tra cứu lớp</h2>
        <p class="glv-lookup-hint">
          Nhập <b>đầy đủ Tên Thánh + Họ và Tên</b> — ví dụ: Maria Nguyễn Thị Lan
        </p>
        <div class="glv-lookup-row">
          <input
            ref="glvInput"
            v-model="glvQuery"
            class="glv-lookup-input"
            type="text"
            placeholder="Tên Thánh, Họ và Tên"
            autocomplete="off"
            spellcheck="false"
            @input="clearGlvResult"
          />
          <button class="text-button text-button--glv" type="submit">
            <Search :size="18" />
            Tìm túi mù
          </button>
        </div>

        <p v-if="glvError" class="glv-lookup-error">{{ glvError }}</p>

        <div v-if="glvMatches.length > 1" class="glv-lookup-matches">
          <p>Có {{ glvMatches.length }} kết quả gần giống, chọn đúng tên của bạn:</p>
          <div class="glv-lookup-match-list">
            <button
              v-for="(match, index) in glvMatches"
              :key="`${match.classItem.id}-${match.role}`"
              class="text-button"
              type="button"
              @click="openGlvBag(match)"
            >
              {{ matchLabel(match, index) }}
            </button>
          </div>
        </div>

        <button class="glv-lookup-back" type="button" @click="closeGlvLookup">
          <ArrowLeft :size="16" />
          Quay lại
        </button>
      </form>
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Activity,
  ArrowLeft,
  Eye,
  EyeOff,
  Play,
  RefreshCcw,
  Search,
  Settings,
  Shuffle,
  UserRound,
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
// quay lại từ Reveal (route mới, component mount lại) vẫn giữ chế độ đang chạy
// thay vì bắt chọn lại từ đầu.
const mode = computed({
  get: () => settings.presenterMode,
  set: (value) => {
    settings.presenterMode = value;
  },
});
const started = computed(() => mode.value === 'children');
const glvInput = ref(null);
const glvQuery = ref('');
const glvError = ref('');
const glvMatches = ref([]);
const randomRunning = ref(false);
const highlightedId = ref('');
const selectedDivision = ref('');
let randomTimer;

const filteredClasses = computed(() => {
  if (!selectedDivision.value) return classesStore.orderedClasses;
  return classesStore.orderedClasses.filter((item) => item.division === selectedDivision.value);
});

onMounted(async () => {
  classesStore.init();
  window.addEventListener('keydown', onKeydown);
  if (mode.value === 'glv') {
    await nextTick();
    glvInput.value?.focus();
  }
});

onBeforeUnmount(() => {
  clearInterval(randomTimer);
  window.removeEventListener('keydown', onKeydown);
});

function startPresenter() {
  mode.value = 'children';
  play('magic');
}

async function openGlvLookup() {
  mode.value = 'glv';
  resetGlvLookup();
  play('click');
  await nextTick();
  glvInput.value?.focus();
}

function closeGlvLookup() {
  mode.value = '';
  resetGlvLookup();
}

function resetGlvLookup() {
  glvQuery.value = '';
  clearGlvResult();
}

function clearGlvResult() {
  glvError.value = '';
  glvMatches.value = [];
}

function submitGlvLookup() {
  const query = glvQuery.value.trim();
  clearGlvResult();

  if (!query) {
    glvError.value = 'Bạn hãy nhập tên Thánh, họ và tên của mình nhé.';
    return;
  }
  if (!classesStore.hydrated) {
    glvError.value = 'Đang tải danh sách lớp, bạn thử lại sau giây lát.';
    return;
  }

  const matches = classesStore.findGlvMatches(query);
  if (!matches.length) {
    glvError.value = `Không tìm thấy Giáo Lý Viên "${query}". Bạn kiểm tra lại xem đã ghi đầy đủ Tên Thánh + Họ và Tên chưa nhé.`;
    return;
  }
  if (matches.length === 1) {
    openGlvBag(matches[0]);
    return;
  }

  glvMatches.value = matches;
}

// Trùng tên đầy đủ thì thêm số thứ tự túi để phân biệt — không lộ tên lớp.
function matchLabel(match, index) {
  const duplicated = glvMatches.value.filter((item) => item.glvName === match.glvName).length > 1;
  return duplicated ? `${match.glvName} — túi mù ${index + 1}` : match.glvName;
}

function openGlvBag(match) {
  play('magic');
  router.push({
    name: 'reveal',
    params: { id: match.classItem.id },
    query: { glv: match.glvName },
  });
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
  if (!started.value) return;

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
