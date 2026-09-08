<template>
  <canvas ref="canvasRef" class="particle-canvas" aria-hidden="true"></canvas>
</template>

<script setup>
import { onBeforeUnmount, onMounted, watch, ref } from 'vue';
import { getDivisionMeta } from '@/data/divisions';

const props = defineProps({
  variant: {
    type: String,
    default: 'THIEU_NHI',
  },
  intensity: {
    type: Number,
    default: 1,
  },
  reduceMotion: {
    type: Boolean,
    default: false,
  },
});

const canvasRef = ref(null);
let context;
let animationFrame;
let particles = [];
let width = 0;
let height = 0;
let pixelRatio = 1;

function makeParticle() {
  const meta = getDivisionMeta(props.variant);
  const colors = ['#ffffff', '#ffe4a3', meta.accent, meta.color];
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    size: 1.2 + Math.random() * 3.8,
    speed: 0.16 + Math.random() * 0.5,
    sway: Math.random() * 0.7,
    phase: Math.random() * Math.PI * 2,
    opacity: 0.22 + Math.random() * 0.58,
    color: colors[Math.floor(Math.random() * colors.length)],
    type: Math.random() > 0.72 ? 'star' : 'dust',
  };
}

function createParticles() {
  const count = props.reduceMotion ? 26 : Math.round(52 + Math.min(props.intensity, 1.8) * 42);
  particles = Array.from({ length: count }, makeParticle);
}

function resize() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  width = rect.width || window.innerWidth;
  height = rect.height || window.innerHeight;
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  context = canvas.getContext('2d');
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  createParticles();
}

function drawStar(particle) {
  context.save();
  context.translate(particle.x, particle.y);
  context.rotate(particle.phase);
  context.globalAlpha = particle.opacity;
  context.strokeStyle = particle.color;
  context.lineWidth = 1.2;
  context.beginPath();
  context.moveTo(-particle.size * 1.6, 0);
  context.lineTo(particle.size * 1.6, 0);
  context.moveTo(0, -particle.size * 1.6);
  context.lineTo(0, particle.size * 1.6);
  context.stroke();
  context.restore();
}

function drawDust(particle) {
  context.globalAlpha = particle.opacity;
  context.fillStyle = particle.color;
  context.beginPath();
  context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
  context.fill();
}

function render() {
  if (!context) return;

  context.clearRect(0, 0, width, height);
  for (const particle of particles) {
    if (particle.type === 'star') {
      drawStar(particle);
    } else {
      drawDust(particle);
    }

    if (!props.reduceMotion) {
      particle.y -= particle.speed * props.intensity;
      particle.x += Math.sin(particle.phase) * particle.sway;
      particle.phase += 0.01;
      if (particle.y < -12) {
        Object.assign(particle, makeParticle(), { y: height + 12 });
      }
    }
  }

  context.globalAlpha = 1;
  animationFrame = requestAnimationFrame(render);
}

onMounted(() => {
  resize();
  render();
  window.addEventListener('resize', resize);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrame);
  window.removeEventListener('resize', resize);
});

watch(
  () => [props.variant, props.intensity, props.reduceMotion],
  () => resize(),
);
</script>
