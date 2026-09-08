import { onBeforeUnmount, onMounted, ref } from 'vue';

export function useFullscreen() {
  const isFullscreen = ref(Boolean(document.fullscreenElement));

  async function enter() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
  }

  async function exit() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  }

  async function toggle() {
    if (document.fullscreenElement) {
      await exit();
    } else {
      await enter();
    }
  }

  function sync() {
    isFullscreen.value = Boolean(document.fullscreenElement);
  }

  onMounted(() => document.addEventListener('fullscreenchange', sync));
  onBeforeUnmount(() => document.removeEventListener('fullscreenchange', sync));

  return { isFullscreen, enter, exit, toggle };
}
