<template>
  <section
    class="reveal-stage"
    :class="[`reveal-stage--${phase}`, { 'reveal-stage--complete': completed, 'controls-hidden': controlsHidden }]"
    :style="stageStyle"
    @mousemove="showControls"
  >
    <ParticleBackground :variant="stageMeta.key" :intensity="particleIntensity" :reduce-motion="settings.reduceMotion" />

    <div class="stage-atmosphere"></div>
    <div class="stage-shell">
      <p ref="messageNode" class="stage-message">{{ stageMessage }}</p>

      <div ref="countdownNode" class="countdown-anchor">
        <Countdown :value="countdownValue" />
      </div>

      <div ref="bagNode" class="bag-theater">
        <BlindBag
          :class-item="classItem"
          :hero="true"
          :revealed="completed"
          :ignore-class-revealed="isGlvMode"
          :disabled="running"
          :theme-key="isGlvMode ? 'GLV' : ''"
          :label-override="isGlvMode ? 'Chạm vào túi để mở' : ''"
          @select="startReveal"
        />
        <TearAnimation :phase="phase" />
      </div>

      <div ref="lightNode" class="reveal-light"></div>

      <div ref="posterWrapNode" class="poster-theater">
        <ClassRevealPoster ref="posterComponent" :class-item="classItem" :solo-name="glvName" animated />
      </div>
    </div>

    <ConfettiEffect :active="confettiActive" />

    <div class="stage-actions">
      <button class="icon-button" type="button" title="Về presenter" @click="$emit('back')">
        <Home :size="20" />
      </button>
      <button class="icon-button" type="button" :title="settings.soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'" @click="toggleSound">
        <Volume2 v-if="settings.soundOn" :size="20" />
        <VolumeX v-else :size="20" />
      </button>
      <FullscreenButton />
      <button class="icon-button stage-back-button" type="button" title="Về màn hình chọn túi mù" @click="$emit('back')">
        <ArrowLeft :size="20" />
      </button>
      <button class="icon-button icon-button--primary" type="button" title="Bắt đầu xé túi" @click="startReveal">
        <Play :size="20" />
      </button>
      <button class="icon-button" type="button" title="Reset animation" @click="resetReveal">
        <RotateCcw :size="20" />
      </button>
      <button
        class="icon-button"
        type="button"
        title="Tải poster PNG"
        :disabled="!completed"
        @click="handleDownload"
      >
        <Download :size="20" />
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import gsap from 'gsap';
import {
  ArrowLeft,
  Download,
  Home,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-vue-next';
import BlindBag from '@/components/BlindBag.vue';
import ClassRevealPoster from '@/components/ClassRevealPoster.vue';
import ConfettiEffect from '@/components/ConfettiEffect.vue';
import Countdown from '@/components/Countdown.vue';
import FullscreenButton from '@/components/FullscreenButton.vue';
import ParticleBackground from '@/components/ParticleBackground.vue';
import TearAnimation from '@/components/TearAnimation.vue';
import { useSound } from '@/composables/useSound';
import { buildRevealTimeline } from '@/composables/useAnimation';
import { GLV_THEME, getDivisionMeta, toAssetStyle } from '@/data/divisions';
import { downloadPoster } from '@/services/exportService';
import { useSettingsStore } from '@/stores/settings';

const props = defineProps({
  classItem: {
    type: Object,
    required: true,
  },
  // Có giá trị khi đi từ luồng tra cứu Giáo Lý Viên: túi mù màu đỏ, poster chỉ
  // hiện đúng GLV này.
  glvName: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['complete', 'back']);

const settings = useSettingsStore();
const { play } = useSound();
const phase = ref('idle');
const countdownValue = ref('');
const running = ref(false);
const completed = ref(false);
const confettiActive = ref(false);
const controlsHidden = ref(false);
const bagNode = ref(null);
const lightNode = ref(null);
const posterWrapNode = ref(null);
const countdownNode = ref(null);
const messageNode = ref(null);
const posterComponent = ref(null);
let timeline;
let controlsTimer;

const meta = computed(() => getDivisionMeta(props.classItem.division));
const isGlvMode = computed(() => Boolean(props.glvName));
// Trước khi poster hiện ra, sân khấu chế độ GLV giữ tông đỏ của túi mù để không
// lộ ngành của lớp; mở xong mới chuyển về màu của ngành.
const posterShown = computed(
  () => completed.value || ['light', 'poster-enter', 'reveal-text', 'celebrate'].includes(phase.value),
);
const stageMeta = computed(() =>
  isGlvMode.value && !posterShown.value ? GLV_THEME : meta.value,
);
const stageStyle = computed(() => ({
  ...toAssetStyle(stageMeta.value),
  '--stage-primary':
    stageMeta.value === meta.value ? props.classItem.primaryColor || meta.value.color : stageMeta.value.color,
}));
const particleIntensity = computed(() => {
  if (['shake', 'tear', 'open', 'light'].includes(phase.value)) return 1.55;
  if (['poster-enter', 'reveal-text', 'celebrate'].includes(phase.value)) return 1.25;
  return 0.82;
});
const stageMessage = computed(() => {
  if (phase.value === 'idle') return isGlvMode.value ? `Chào GLV ${props.glvName}` : 'Các bạn đã sẵn sàng chưa?';
  if (phase.value === 'countdown') return 'Cùng đếm ngược';
  if (phase.value === 'shake') return 'Túi mù đang chuyển động';
  if (phase.value === 'tear') return 'Mở túi mù';
  if (phase.value === 'poster-enter') return `Lớp ${props.classItem.className}`;
  if (phase.value === 'reveal-text') return isGlvMode.value ? 'Lớp phụ trách năm nay' : 'Giáo Lý Viên';
  if (completed.value) return isGlvMode.value ? 'Chúc mừng' : 'Chào mừng';
  return 'Khám phá lớp giáo lý';
});

async function startReveal() {
  if (running.value) return;
  if (completed.value && !settings.allowReReveal) return;
  if (completed.value) resetReveal();

  running.value = true;
  await nextTick();
  timeline?.kill();
  timeline = buildRevealTimeline({
    gsap,
    bag: bagNode.value,
    topStrip: bagNode.value?.querySelector('.bag-top'),
    poster: posterWrapNode.value,
    light: lightNode.value,
    countdown: countdownNode.value,
    message: messageNode.value,
    reduceMotion: settings.reduceMotion,
    setPhase: (value) => {
      phase.value = value;
    },
    setCountdown: (value) => {
      countdownValue.value = value;
    },
    onSound: play,
    onCelebrate: fireConfetti,
    onComplete: finishReveal,
  });
  timeline.play(0);
}

function finishReveal() {
  running.value = false;
  completed.value = true;
  emit('complete', props.classItem);
}

function fireConfetti() {
  confettiActive.value = false;
  requestAnimationFrame(() => {
    confettiActive.value = true;
  });
}

function resetReveal() {
  timeline?.kill();
  phase.value = 'idle';
  countdownValue.value = '';
  running.value = false;
  completed.value = false;
  confettiActive.value = false;
  gsap.set([bagNode.value, lightNode.value, posterWrapNode.value], { clearProps: 'all' });
}

function toggleSound() {
  settings.toggle('soundOn');
}

async function handleDownload() {
  const exposedPoster = posterComponent.value?.posterNode;
  await downloadPoster(exposedPoster?.value || exposedPoster, props.classItem);
}

function isTypingTarget(event) {
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName);
}

function onKeydown(event) {
  if (isTypingTarget(event)) return;

  if (event.code === 'Space') {
    event.preventDefault();
    startReveal();
  } else if (event.key.toLowerCase() === 'r') {
    resetReveal();
  } else if (event.key === 'Escape') {
    emit('back');
  } else if (event.key.toLowerCase() === 'f') {
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  } else if (event.key.toLowerCase() === 's') {
    toggleSound();
  } else if (event.key === 'ArrowLeft') {
    emit('back');
  }
}

function showControls() {
  controlsHidden.value = false;
  clearTimeout(controlsTimer);
  if (document.fullscreenElement) {
    controlsTimer = setTimeout(() => {
      controlsHidden.value = true;
    }, 2800);
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  clearTimeout(controlsTimer);
  timeline?.kill();
});

watch(
  () => props.classItem.id,
  () => resetReveal(),
);
</script>
