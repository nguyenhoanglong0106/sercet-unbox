import { ASSETS } from './divisions';

export const DEFAULT_ORGANIZATION = {
  name: 'Đoàn Thiếu Nhi Thánh Thể Đaminh Saviô',
  parishName: 'Giáo Xứ Bắc Thần',
  diocese: '',
  academicYear: '2026 - 2027',
  slogan: '',
  logoUrl: ASSETS.logo,
  backgroundUrl: ASSETS.background,
  churchImageUrl: ASSETS.church,
};

export const ORGANIZATION_LIMITS = {
  name: 120,
  parishName: 100,
  diocese: 100,
  academicYear: 30,
  slogan: 160,
};

export function normalizeOrganization(input = {}) {
  return Object.fromEntries(Object.entries(DEFAULT_ORGANIZATION).map(([key, fallback]) => [
    key,
    typeof input?.[key] === 'string' ? input[key].trim() : fallback,
  ]));
}

export function validateOrganization(profile) {
  const errors = {};
  for (const key of ['name', 'parishName', 'academicYear']) {
    if (!profile[key]) errors[key] = 'Vui lòng điền thông tin này.';
  }
  for (const [key, limit] of Object.entries(ORGANIZATION_LIMITS)) {
    if (profile[key]?.length > limit) errors[key] = `Tối đa ${limit} ký tự.`;
  }
  for (const key of ['logoUrl', 'backgroundUrl', 'churchImageUrl']) {
    const value = profile[key];
    if (value && !value.startsWith('/assets/')) {
      try {
        if (new URL(value).protocol !== 'https:') throw new Error();
      } catch {
        errors[key] = 'Vui lòng nhập đường dẫn ảnh HTTPS hợp lệ.';
      }
    }
  }
  return errors;
}
