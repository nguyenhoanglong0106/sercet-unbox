import { computed, ref } from 'vue';
import { ASSETS, inferDivisionFromClassName } from '@/data/divisions';
import { guessGenderFromSaintName } from '@/data/saintGenders';
import { uploadClassImage } from '@/services/imageService';
import { useClassesStore } from '@/stores/classes';

// State dùng chung giữa nút "Chọn file Excel" (đặt trong card Thêm lớp) và
// bảng chỉnh sửa/import (hiển thị full-width bên dưới) — cả hai cùng đọc/ghi
// một state duy nhất nên không cần lift state lên component cha.
const fileName = ref('');
const rows = ref([]);
const parsedTotal = ref(0);
const activeTotal = ref(0);
const error = ref('');
const importError = ref('');
const importSummary = ref('');
const importing = ref(false);
const uploadingRowId = ref('');

const collator = new Intl.Collator('vi', { sensitivity: 'base' });

const sortedRows = computed(() => [...rows.value].sort((a, b) => collator.compare(a.hoTen, b.hoTen)));

const canImport = computed(() => rows.value.length > 0 && rows.value.every(isRowComplete));

function isRowComplete(row) {
  return Boolean(row.lop.trim() && row.glvRole && row.gender);
}

function formatName(row) {
  return [row.tenThanh, row.hoTen].filter(Boolean).join(' ').trim();
}

function initials(row) {
  const words = formatName(row).trim().split(/\s+/).slice(-2);
  return words.map((word) => word[0]?.toUpperCase() || '').join('') || 'GLV';
}

function resolvePhoto(row) {
  if (row.photoOverride) return row.photoOverride;
  if (row.gender === 'NAM') return ASSETS.glvNam;
  if (row.gender === 'NU') return ASSETS.glvNu;
  return '';
}

// Gợi ý sẵn GLV: nếu 2 người đã chung 1 lớp (cột Lớp đang dạy có sẵn) thì
// người đầu GLV1, người sau GLV2; các trường hợp còn lại mặc định GLV1 (đa số
// lớp chỉ có 1 GLV). Giới tính gợi ý theo Tên Thánh. Người dùng vẫn xem/sửa
// lại trước khi tạo lớp.
function withSuggestedDefaults(records) {
  const byClass = new Map();
  for (const record of records) {
    const key = record.lop.trim();
    if (!key) continue;
    if (!byClass.has(key)) byClass.set(key, []);
    byClass.get(key).push(record);
  }

  const roleByRecord = new Map();
  for (const groupRows of byClass.values()) {
    if (groupRows.length === 1) {
      roleByRecord.set(groupRows[0], 'GLV1');
    } else if (groupRows.length === 2) {
      roleByRecord.set(groupRows[0], 'GLV1');
      roleByRecord.set(groupRows[1], 'GLV2');
    }
  }

  return records.map((record) => ({
    id: crypto.randomUUID(),
    tenThanh: record.tenThanh,
    hoTen: record.hoTen,
    lop: record.lop,
    // Mặc định GLV 1 vì đa số chỉ có 1 giáo lý viên/lớp — nhanh hơn khi phải
    // duyệt hàng chục dòng, chỉ cần đổi lại thành GLV 2 cho người phụ (nếu có).
    glvRole: roleByRecord.get(record) || 'GLV1',
    gender: guessGenderFromSaintName(record.tenThanh),
    photoOverride: '',
  }));
}

async function handleFile(file) {
  if (!file) return;

  error.value = '';
  importError.value = '';
  importSummary.value = '';

  try {
    // Lazy-load: thư viện đọc Excel khá nặng, chỉ tải khi thực sự bấm chọn file
    // để không ảnh hưởng tốc độ tải các màn hình chính (Presenter/Reveal).
    const { parseGlvExcelFile } = await import('@/services/glvImportService');
    const result = await parseGlvExcelFile(file);
    fileName.value = file.name;
    parsedTotal.value = result.totalCount;
    activeTotal.value = result.activeRecords.length;
    rows.value = withSuggestedDefaults(result.activeRecords);
  } catch (err) {
    error.value = err.message || 'Không đọc được file Excel. Vui lòng kiểm tra lại định dạng file.';
    rows.value = [];
  }
}

function deleteRow(row) {
  rows.value = rows.value.filter((item) => item.id !== row.id);
}

async function setRowPhoto(row, file) {
  if (!file) return;
  uploadingRowId.value = row.id;
  try {
    row.photoOverride = await uploadClassImage(file, 'glv-import');
  } catch (err) {
    alert(err.message);
  } finally {
    uploadingRowId.value = '';
  }
}

function resetPhoto(row) {
  row.photoOverride = '';
}

function cancelImport() {
  rows.value = [];
  fileName.value = '';
  error.value = '';
  importError.value = '';
  importSummary.value = '';
}

function findRoleConflicts() {
  const byClass = new Map();
  for (const row of rows.value) {
    const key = row.lop.trim();
    if (!byClass.has(key)) byClass.set(key, []);
    byClass.get(key).push(row);
  }

  const conflicts = [];
  for (const [className, groupRows] of byClass) {
    const glv1Count = groupRows.filter((row) => row.glvRole === 'GLV1').length;
    const glv2Count = groupRows.filter((row) => row.glvRole === 'GLV2').length;
    if (glv1Count > 1 || glv2Count > 1) conflicts.push(className);
  }
  return conflicts;
}

async function runImport() {
  const classesStore = useClassesStore();
  importError.value = '';
  importSummary.value = '';

  if (!canImport.value) {
    importError.value = 'Vui lòng nhập đủ Lớp đang dạy, GLV và Giới tính cho tất cả các dòng (hoặc xóa dòng không cần import).';
    return;
  }

  const conflicts = findRoleConflicts();
  if (conflicts.length) {
    importError.value = `Các lớp sau có hơn 1 người cùng vai trò GLV 1 hoặc GLV 2, vui lòng kiểm tra lại: ${conflicts.join(', ')}.`;
    return;
  }

  importing.value = true;
  try {
    const byClass = new Map();
    for (const row of rows.value) {
      const key = row.lop.trim();
      if (!byClass.has(key)) byClass.set(key, []);
      byClass.get(key).push(row);
    }

    let created = 0;
    let updated = 0;

    for (const [className, groupRows] of byClass) {
      const glv1 = groupRows.find((row) => row.glvRole === 'GLV1');
      const glv2 = groupRows.find((row) => row.glvRole === 'GLV2');
      const primary = glv1 || glv2;
      const secondary = glv1 && glv2 ? glv2 : null;

      const payload = {
        className,
        division: inferDivisionFromClassName(className) || undefined,
        teacherName: primary ? formatName(primary) : '',
        assistantName: secondary ? formatName(secondary) : '',
        teacherImage: primary ? resolvePhoto(primary) : '',
        assistantImage: secondary ? resolvePhoto(secondary) : '',
      };

      const existing = classesStore.orderedClasses.find(
        (item) => item.className.trim().toLowerCase() === className.toLowerCase(),
      );

      if (existing) {
        await classesStore.updateClass(existing.id, payload);
        updated += 1;
      } else {
        await classesStore.addClass(payload);
        created += 1;
      }
    }

    importSummary.value = `Đã tạo ${created} lớp mới${updated ? `, cập nhật ${updated} lớp đã có` : ''}.`;
    rows.value = [];
    fileName.value = '';
  } catch (err) {
    importError.value = err.message || 'Có lỗi khi tạo lớp. Vui lòng thử lại.';
  } finally {
    importing.value = false;
  }
}

export function useGlvImport() {
  return {
    fileName,
    rows,
    sortedRows,
    parsedTotal,
    activeTotal,
    error,
    importError,
    importSummary,
    importing,
    uploadingRowId,
    canImport,
    isRowComplete,
    initials,
    resolvePhoto,
    handleFile,
    deleteRow,
    setRowPhoto,
    resetPhoto,
    cancelImport,
    runImport,
  };
}
