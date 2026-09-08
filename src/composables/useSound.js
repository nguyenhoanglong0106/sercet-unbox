import { useSettingsStore } from '@/stores/settings';

const SOUND_FILES = {
  click: '/sounds/click.mp3',
  magic: '/sounds/magic.mp3',
  paper: '/sounds/paper.mp3',
  success: '/sounds/success.mp3',
  bagOpen: '/sounds/bag-open.mp3',
  wow: '/sounds/wow.mp3',
};

const FALLBACK_TONES = {
  click: 360,
  magic: 640,
  paper: 140,
  success: 820,
  bagOpen: 140,
  wow: 820,
};

let audioContext;

function playTone(frequency, volume) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  audioContext ||= new AudioContextClass();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.frequency.value = frequency;
  oscillator.type = frequency < 200 ? 'sawtooth' : 'sine';
  gain.gain.value = volume * 0.12;
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.25);

  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.26);
}

export function useSound() {
  const settings = useSettingsStore();

  function play(name) {
    if (!settings.soundOn) return;

    const src = SOUND_FILES[name];
    const volume = settings.volume;
    const audio = src ? new Audio(src) : null;

    if (!audio) {
      playTone(FALLBACK_TONES[name] || 520, volume);
      return;
    }

    audio.volume = volume;
    audio.play().catch(() => playTone(FALLBACK_TONES[name] || 520, volume));
  }

  return { play };
}
