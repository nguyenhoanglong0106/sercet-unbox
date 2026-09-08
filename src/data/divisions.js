export const DIVISIONS = {
  CHIEN_CON: {
    key: 'CHIEN_CON',
    label: 'Chiên Con',
    shortLabel: 'Chiên Con',
    color: '#f3a6bd',
    soft: '#fde8ef',
    accent: '#ffd0df',
    deep: '#b84f73',
    asset: '/assets/chien-con.jpg',
  },
  AU_NHI: {
    key: 'AU_NHI',
    label: 'Ấu Nhi',
    shortLabel: 'Ấu Nhi',
    color: '#46b779',
    soft: '#d8f2de',
    accent: '#f7ca64',
    deep: '#1f6f4a',
    asset: '/assets/au-nhi.jpg',
  },
  THIEU_NHI: {
    key: 'THIEU_NHI',
    label: 'Thiếu Nhi',
    shortLabel: 'Thiếu Nhi',
    color: '#3997d3',
    soft: '#d8edf9',
    accent: '#ffd166',
    deep: '#155f90',
    asset: '/assets/thieu-nhi.jpg',
  },
  NGHIA_SI: {
    key: 'NGHIA_SI',
    label: 'Nghĩa Sĩ',
    shortLabel: 'Nghĩa Sĩ',
    color: '#e5b84e',
    soft: '#fff0bd',
    accent: '#7ec8e3',
    deep: '#9a6d0a',
    asset: '/assets/nghia-si.jpg',
  },
  HIEP_SI: {
    key: 'HIEP_SI',
    label: 'Hiệp Sĩ',
    shortLabel: 'Hiệp Sĩ',
    color: '#d18445',
    soft: '#f7dfca',
    accent: '#8bc9b5',
    deep: '#7a421a',
    asset: '/assets/hiep-si.jpg',
  },
};

export const DIVISION_OPTIONS = Object.values(DIVISIONS);

export const ASSETS = {
  background: '/assets/background.png',
  church: '/assets/church-bac-than.png',
  logo: '/assets/logo-tntt.png',
  branchFallback: '/assets/logo-tntt.png',
  glvNam: '/assets/glv-nam.jpg',
  glvNu: '/assets/glv-nu.jpg',
};

export function getDivisionMeta(key = 'THIEU_NHI') {
  return DIVISIONS[key] || DIVISIONS.THIEU_NHI;
}

export function toAssetStyle(meta) {
  return {
    '--theme-color': meta.color,
    '--theme-soft': meta.soft,
    '--theme-accent': meta.accent,
    '--theme-deep': meta.deep,
  };
}

function normalizeForMatch(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Suy ra ngành từ tên lớp, vd "Chiên Con 1A" -> CHIEN_CON, "Lớp Thiếu Nhi 3" -> THIEU_NHI.
export function inferDivisionFromClassName(className) {
  const normalized = normalizeForMatch(className);
  const match = DIVISION_OPTIONS.find((division) => normalized.includes(normalizeForMatch(division.label)));
  return match?.key || '';
}
