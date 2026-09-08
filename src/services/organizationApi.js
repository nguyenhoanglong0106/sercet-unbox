import { normalizeOrganization } from '@/data/organization';
import { supabase } from '@/services/supabaseClient';

const TABLE = 'organization_settings';

function fromRow(row) {
  return normalizeOrganization({
    name: row.name,
    parishName: row.parish_name,
    diocese: row.diocese,
    academicYear: row.academic_year,
    slogan: row.slogan,
    logoUrl: row.logo_url,
    backgroundUrl: row.background_url,
    churchImageUrl: row.church_image_url,
  });
}

function assertNoError(error) {
  if (!error) return;
  if (['PGRST205', '42P01'].includes(error.code)) {
    throw new Error('Chưa có bảng thông tin xứ đoàn trên máy chủ.');
  }
  throw new Error('Không thể đồng bộ thông tin xứ đoàn. Vui lòng kiểm tra kết nối và thử lại.');
}

export async function fetchOrganization() {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', 1)
    .maybeSingle().abortSignal(AbortSignal.timeout(10000));
  assertNoError(error);
  return data ? fromRow(data) : null;
}

export async function saveOrganization(profile) {
  const { data, error } = await supabase.from(TABLE).upsert({
    id: 1,
    name: profile.name,
    parish_name: profile.parishName,
    diocese: profile.diocese,
    academic_year: profile.academicYear,
    slogan: profile.slogan,
    logo_url: profile.logoUrl,
    background_url: profile.backgroundUrl,
    church_image_url: profile.churchImageUrl,
    updated_at: new Date().toISOString(),
  }).select().single().abortSignal(AbortSignal.timeout(10000));
  assertNoError(error);
  return fromRow(data);
}
