import { defineStore } from 'pinia';

const STORAGE_KEY = 'giao-ly-reveal-settings';

const DEFAULT_SETTINGS = {
  showClassNames: true,
  soundOn: true,
  volume: 0.5,
  reduceMotion: false,
  allowReReveal: true,
  randomOnlyUnrevealed: true,
  // Không lưu vào localStorage (xem persist() bên dưới) — chỉ giữ trong phiên
  // làm việc hiện tại, để khi quay lại từ Reveal không phải chọn lại chế độ,
  // nhưng vẫn về lại màn hình giới thiệu nếu tải lại trang.
  // '' = màn hình chọn chế độ, 'children' = bảng túi mù thiếu nhi, 'glv' = tra cứu GLV.
  presenterMode: '',
};

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export const useSettingsStore = defineStore('settings', {
  state: () => loadSettings(),
  actions: {
    patchSetting(key, value) {
      this[key] = value;
      this.persist();
    },
    toggle(key) {
      this[key] = !this[key];
      this.persist();
    },
    persist() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          showClassNames: this.showClassNames,
          soundOn: this.soundOn,
          volume: this.volume,
          reduceMotion: this.reduceMotion,
          allowReReveal: this.allowReReveal,
          randomOnlyUnrevealed: this.randomOnlyUnrevealed,
        }),
      );
    },
  },
});
