<template>
  <section v-if="rows.length" class="setup-panel glv-table-panel">
    <div class="panel-title">
      <h2>Danh sách import từ Excel</h2>
      <span v-if="fileName" class="glv-filename">{{ fileName }}</span>
    </div>

    <p class="glv-summary">
      Đã lọc {{ activeTotal }}/{{ parsedTotal }} giáo lý viên đang có trạng thái
      <strong>Bình thường</strong>.
      Đã gợi ý sẵn GLV và Giới tính, kiểm tra/sửa lại nếu sai. Điền đủ
      <strong>Lớp đang dạy</strong>, xóa những ai không được phân công dạy năm nay, sau đó bấm
      <strong>Tạo lớp</strong>.
    </p>

    <div class="glv-table-wrap">
      <table class="glv-table">
        <thead>
          <tr>
            <th class="glv-col-stt">STT</th>
            <th>Ảnh</th>
            <th>Tên Thánh</th>
            <th>Họ Tên</th>
            <th>Lớp đang dạy</th>
            <th>GLV</th>
            <th>Giới tính</th>
            <th class="glv-col-stt"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in sortedRows"
            :key="row.id"
            :class="{ 'glv-row-incomplete': !isRowComplete(row) }"
          >
            <td class="glv-col-stt">{{ index + 1 }}</td>
            <td>
              <div class="glv-photo-cell">
                <button
                  type="button"
                  class="glv-photo-avatar"
                  :class="{ 'glv-photo-avatar--busy': uploadingRowId === row.id }"
                  title="Tải ảnh riêng cho người này"
                  @click="triggerPhotoUpload(row)"
                >
                  <img v-if="resolvePhoto(row)" :src="resolvePhoto(row)" alt="" />
                  <span v-else>{{ initials(row) }}</span>
                </button>
                <button
                  v-if="row.photoOverride"
                  type="button"
                  class="glv-photo-reset"
                  title="Dùng ảnh mặc định theo giới tính"
                  @click="resetPhoto(row)"
                >
                  <RotateCcw :size="12" />
                </button>
              </div>
            </td>
            <td>{{ row.tenThanh || '—' }}</td>
            <td>{{ row.hoTen || '—' }}</td>
            <td>
              <input v-model.trim="row.lop" type="text" class="glv-cell-input" placeholder="Tên lớp..." />
            </td>
            <td>
              <div class="glv-toggle-group" :class="{ 'glv-toggle-group--missing': !row.glvRole }">
                <button type="button" :class="{ active: row.glvRole === 'GLV1' }" @click="row.glvRole = 'GLV1'">
                  GLV 1
                </button>
                <button type="button" :class="{ active: row.glvRole === 'GLV2' }" @click="row.glvRole = 'GLV2'">
                  GLV 2
                </button>
              </div>
            </td>
            <td>
              <div class="glv-toggle-group" :class="{ 'glv-toggle-group--missing': !row.gender }">
                <button type="button" :class="{ active: row.gender === 'NAM' }" @click="row.gender = 'NAM'">
                  Nam
                </button>
                <button type="button" :class="{ active: row.gender === 'NU' }" @click="row.gender = 'NU'">
                  Nữ
                </button>
              </div>
            </td>
            <td class="glv-col-stt">
              <button class="icon-button icon-button--danger" type="button" title="Xóa" @click="deleteRow(row)">
                <Trash2 :size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <input ref="photoInput" class="sr-only" type="file" accept="image/*,.tif,.tiff" @change="handlePhotoChange" />

    <div class="glv-import-actions">
      <p v-if="importError" class="glv-error">{{ importError }}</p>
      <p v-else-if="importSummary" class="glv-summary glv-summary--success">{{ importSummary }}</p>
      <button class="text-button" type="button" :disabled="importing" @click="cancelImport">
        <X :size="18" />
        Hủy
      </button>
      <button
        class="text-button text-button--primary"
        type="button"
        :disabled="!canImport || importing"
        @click="runImport"
      >
        <Wand2 :size="18" />
        {{ importing ? 'Đang tạo lớp...' : 'Tạo lớp từ danh sách' }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { RotateCcw, Trash2, Wand2, X } from 'lucide-vue-next';
import { useGlvImport } from '@/composables/useGlvImport';

const {
  fileName,
  rows,
  sortedRows,
  parsedTotal,
  activeTotal,
  importError,
  importSummary,
  importing,
  uploadingRowId,
  canImport,
  isRowComplete,
  initials,
  resolvePhoto,
  deleteRow,
  setRowPhoto,
  resetPhoto,
  cancelImport,
  runImport,
} = useGlvImport();

const photoInput = ref(null);
const activeUploadRowId = ref('');

function triggerPhotoUpload(row) {
  activeUploadRowId.value = row.id;
  photoInput.value?.click();
}

async function handlePhotoChange(event) {
  const file = event.target.files?.[0];
  const rowId = activeUploadRowId.value;
  event.target.value = '';
  if (!file || !rowId) return;

  const row = rows.value.find((item) => item.id === rowId);
  if (!row) return;

  await setRowPhoto(row, file);
}
</script>
