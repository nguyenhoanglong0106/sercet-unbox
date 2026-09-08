import * as XLSX from 'xlsx';

// Trạng thái được coi là "đang hoạt động bình thường".
// Các trạng thái khác thường gặp trong file mẫu: "Nghỉ luôn", "Tạm nghỉ", "Chuyển xứ".
const ACTIVE_STATUS = 'binh thuong';

// Các tên cột (đã chuẩn hoá) có thể gặp trong file Excel danh sách GLV.
const HEADER_ALIASES = {
  stt: ['stt'],
  tenThanh: ['ten thanh'],
  ho: ['ho'],
  ten: ['ten'],
  hoTen: ['ho va ten', 'ho ten', 'ho va ten dem', 'ho ten dem'],
  lop: ['lop dang day', 'lop'],
  tinhTrang: ['tinh trang'],
};

function stripDiacritics(value) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd');
}

function normalizeText(value) {
  return stripDiacritics(String(value ?? ''))
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function cellText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function isActiveStatus(status) {
  return normalizeText(status) === ACTIVE_STATUS;
}

function findHeaderRowIndex(rows) {
  const limit = Math.min(rows.length, 20);
  for (let i = 0; i < limit; i++) {
    const row = rows[i] || [];
    const hasTenThanh = row.some((cell) => normalizeText(cell) === 'ten thanh');
    if (hasTenThanh) return i;
  }
  return -1;
}

function resolveColumns(headerRow) {
  const normalizedHeader = headerRow.map((cell) => normalizeText(cell));
  const columns = {};

  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    let foundIndex = -1;
    for (const alias of aliases) {
      const index = normalizedHeader.findIndex((cell) => cell === alias);
      if (index !== -1) {
        foundIndex = index;
        break;
      }
    }
    columns[field] = foundIndex;
  }

  return columns;
}

function guessUnitLabel(rows, headerRowIndex) {
  for (let i = 0; i < headerRowIndex; i++) {
    const row = rows[i] || [];
    const nonEmptyCells = row.map(cellText).filter(Boolean);
    if (nonEmptyCells.length === 1 && !/danh sách/i.test(nonEmptyCells[0])) {
      return nonEmptyCells[0];
    }
  }
  return '';
}

function parseSheet(sheet, sheetName) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const headerRowIndex = findHeaderRowIndex(rows);
  if (headerRowIndex === -1) {
    return { sheetName, unitLabel: '', records: [], headerFound: false };
  }

  const columns = resolveColumns(rows[headerRowIndex]);
  const unitLabel = guessUnitLabel(rows, headerRowIndex);
  const records = [];

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const tenThanh = columns.tenThanh !== -1 ? cellText(row[columns.tenThanh]) : '';
    const ho = columns.ho !== -1 ? cellText(row[columns.ho]) : '';
    const ten = columns.ten !== -1 ? cellText(row[columns.ten]) : '';
    const hoTenCombined = columns.hoTen !== -1 ? cellText(row[columns.hoTen]) : '';
    const hoTen = hoTenCombined || [ho, ten].filter(Boolean).join(' ').trim();
    const lop = columns.lop !== -1 ? cellText(row[columns.lop]) : '';
    const tinhTrang = columns.tinhTrang !== -1 ? cellText(row[columns.tinhTrang]) : '';

    if (!tenThanh && !hoTen) continue; // dòng trống / dòng phân cách

    records.push({
      stt: columns.stt !== -1 ? cellText(row[columns.stt]) : String(records.length + 1),
      tenThanh,
      hoTen,
      lop,
      tinhTrang,
      sheetName,
    });
  }

  return { sheetName, unitLabel, records, headerFound: true };
}

export async function parseGlvExcelFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const sheetResults = workbook.SheetNames.map((sheetName) =>
    parseSheet(workbook.Sheets[sheetName], sheetName),
  );

  const usableSheets = sheetResults.filter((result) => result.headerFound);
  if (usableSheets.length === 0) {
    throw new Error(
      'Không tìm thấy cột "Tên Thánh" trong file. Vui lòng kiểm tra đúng file danh sách Giáo Lý Viên.',
    );
  }

  const allRecords = usableSheets.flatMap((result) => result.records);
  const unitLabel = usableSheets.find((result) => result.unitLabel)?.unitLabel || '';

  return {
    unitLabel,
    sheetCount: usableSheets.length,
    totalCount: allRecords.length,
    records: allRecords,
    activeRecords: allRecords.filter((record) => isActiveStatus(record.tinhTrang)),
  };
}
