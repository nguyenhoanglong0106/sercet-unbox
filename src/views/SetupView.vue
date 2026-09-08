<template>
  <main class="setup-view" :class="{ 'setup-view--organization': activeSection === 'organization' }">
    <header class="setup-topbar">
      <div class="setup-brand">
        <OrganizationLogo :src="organization.profile.logoUrl" />
        <div>
          <span>{{ organization.profile.parishName }}</span>
          <h1>Quản trị lớp giáo lý</h1>
        </div>
      </div>
      <nav class="setup-nav">
        <RouterLink class="text-button" to="/ket-qua">
          <ListChecks :size="18" />
          Trang kết quả
        </RouterLink>
        <RouterLink class="text-button" to="/presenter">
          <MonitorPlay :size="18" />
          Presenter
        </RouterLink>
      </nav>
    </header>

    <nav class="setup-tabs" aria-label="Thiết lập">
      <button type="button" :class="{ active: activeSection === 'organization' }" :aria-pressed="activeSection === 'organization'" @click="activeSection = 'organization'">
        <Church :size="18" />
        Thông tin xứ đoàn
      </button>
      <button type="button" :class="{ active: activeSection === 'classes' }" :aria-pressed="activeSection === 'classes'" @click="activeSection = 'classes'">
        <ListChecks :size="18" />
        Quản lý lớp
      </button>
      <button type="button" :class="{ active: activeSection === 'guide' }" :aria-pressed="activeSection === 'guide'" @click="activeSection = 'guide'">
        <BookOpen :size="18" />
        Hướng dẫn
      </button>
    </nav>

    <OrganizationSetup v-show="activeSection === 'organization'" />

    <div v-show="activeSection === 'guide'" class="setup-panel guide-panel">
      <SetupGuide />
    </div>

    <div v-show="activeSection === 'classes'">

    <p v-if="classesStore.busy && !classesStore.hydrated" class="setup-status">Đang tải danh sách lớp...</p>
    <p v-else-if="classesStore.error" class="setup-status setup-status--error">
      Không tải được dữ liệu từ Supabase: {{ classesStore.error }}
    </p>

    <section class="setup-classes-layout">
      <form class="setup-panel setup-form" @submit.prevent="saveClass">
        <div class="glv-inline-import">
          <button class="text-button" type="button" @click="glvFileInput?.click()">
            <Upload :size="18" />
            Import từ Excel (.xlsx)
          </button>
          <input
            ref="glvFileInput"
            class="sr-only"
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            @change="handleGlvFile"
          />
          <span v-if="glv.fileName.value" class="glv-filename">{{ glv.fileName.value }}</span>
        </div>
        <p v-if="glv.error.value" class="glv-error">{{ glv.error.value }}</p>

        <div class="panel-title">
          <h2>{{ editingId ? 'Sửa lớp' : 'Thêm lớp' }}</h2>
          <button v-if="editingId" class="icon-button" type="button" title="Hủy sửa" @click="resetForm">
            <X :size="18" />
          </button>
        </div>

        <div class="field-grid">
          <label>
            <span>Tên lớp</span>
            <input v-model.trim="form.className" required type="text" placeholder="Thiếu Nhi 1" />
          </label>
          <label>
            <span>Khối / Ngành</span>
            <select v-model="form.division" @change="onDivisionChange">
              <option v-for="division in divisions" :key="division.key" :value="division.key">
                {{ division.label }}
              </option>
            </select>
          </label>
          <label>
            <span>Giáo lý viên chính</span>
            <input v-model.trim="form.teacherName" type="text" placeholder="Giáo Lý Viên A" />
          </label>
          <label>
            <span>Giáo lý viên phụ</span>
            <input v-model.trim="form.assistantName" type="text" placeholder="Giáo Lý Viên B" />
          </label>
          <label>
            <span>Câu khẩu hiệu</span>
            <input v-model.trim="form.slogan" type="text" placeholder="Học Giáo Lý - Sống Đức Tin" />
          </label>
          <label>
            <span>Màu chủ đạo</span>
            <input v-model="form.primaryColor" type="color" />
          </label>
        </div>

        <div class="upload-grid">
          <label
            class="upload-tile"
            :class="{ 'upload-tile--busy': uploadingField === 'teacherImage', 'upload-tile--filled': form.teacherImage }"
          >
            <img v-if="form.teacherImage" class="upload-tile-preview" :src="form.teacherImage" alt="" />
            <Image v-else :size="20" />
            <span class="upload-tile-label">{{ uploadingField === 'teacherImage' ? 'Đang tải lên...' : 'Hình GLV chính' }}</span>
            <span v-if="form.teacherImage && uploadingField !== 'teacherImage'" class="upload-tile-check" title="Đang dùng ảnh đã tải lên">
              <Check :size="12" />
            </span>
            <button
              v-if="form.teacherImage && uploadingField !== 'teacherImage'"
              type="button"
              class="upload-tile-remove"
              title="Xóa ảnh, dùng icon mặc định"
              @click.stop.prevent="form.teacherImage = ''"
            >
              <X :size="12" />
            </button>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.tif,.tiff,image/*"
              :disabled="!!uploadingField"
              @change="handleImage($event, 'teacherImage')"
            />
          </label>
          <label
            class="upload-tile"
            :class="{ 'upload-tile--busy': uploadingField === 'assistantImage', 'upload-tile--filled': form.assistantImage }"
          >
            <img v-if="form.assistantImage" class="upload-tile-preview" :src="form.assistantImage" alt="" />
            <Image v-else :size="20" />
            <span class="upload-tile-label">{{ uploadingField === 'assistantImage' ? 'Đang tải lên...' : 'Hình GLV phụ' }}</span>
            <span v-if="form.assistantImage && uploadingField !== 'assistantImage'" class="upload-tile-check" title="Đang dùng ảnh đã tải lên">
              <Check :size="12" />
            </span>
            <button
              v-if="form.assistantImage && uploadingField !== 'assistantImage'"
              type="button"
              class="upload-tile-remove"
              title="Xóa ảnh, dùng icon mặc định"
              @click.stop.prevent="form.assistantImage = ''"
            >
              <X :size="12" />
            </button>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.tif,.tiff,image/*"
              :disabled="!!uploadingField"
              @change="handleImage($event, 'assistantImage')"
            />
          </label>
        </div>

        <label>
          <span>Ghi chú</span>
          <textarea v-model.trim="form.notes" rows="3"></textarea>
        </label>

        <div class="form-actions">
          <button class="text-button text-button--primary" type="submit">
            <Save :size="18" />
            {{ editingId ? 'Lưu lớp' : 'Thêm lớp' }}
          </button>
          <button class="text-button" type="button" @click="resetForm">
            <RotateCcw :size="18" />
            Làm mới
          </button>
        </div>
      </form>

      <div class="setup-panel classes-section">
        <div class="classes-heading">
          <div>
            <span>{{ filteredClassList.length }}/{{ classesStore.orderedClasses.length }} lớp</span>
            <h2>Danh sách lớp</h2>
          </div>
          <div class="classes-actions">
            <select v-model="classFilterDivision" class="classes-filter">
              <option value="">Tất cả ngành</option>
              <option v-for="division in divisions" :key="division.key" :value="division.key">
                {{ division.label }}
              </option>
            </select>
            <button class="text-button text-button--danger" type="button" @click="resetReveals">
              <RefreshCcw :size="18" />
              Reset
            </button>
          </div>
        </div>

        <p v-if="!filteredClassList.length" class="classes-empty">Không có lớp nào thuộc ngành này.</p>

        <div v-else class="class-list">
          <article
            v-for="classItem in filteredClassList"
            :key="classItem.id"
            class="class-card"
            draggable="true"
            @dragstart="dragStart(classItem)"
            @dragover.prevent
            @drop="dropOn(classItem)"
          >
            <GripVertical class="drag-handle" :size="18" />
            <TeacherPhoto :src="classItem.teacherImage" :name="classItem.teacherName" size="small" />
            <div class="class-card-main">
              <strong>{{ classItem.className }}</strong>
              <span>{{ classItem.teacherName || 'Chưa nhập GLV' }}</span>
            </div>
            <span class="status-pill" :class="{ revealed: classItem.revealed }">
              {{ classItem.revealed ? 'Đã mở' : 'Chưa mở' }}
            </span>
            <div class="class-card-actions">
              <button class="icon-button" type="button" title="Sửa" @click="editClass(classItem)">
                <Pencil :size="18" />
              </button>
              <button class="icon-button icon-button--danger" type="button" title="Xóa" @click="deleteClass(classItem)">
                <Trash2 :size="18" />
              </button>
            </div>
          </article>
        </div>
      </div>

    </section>

    <GlvImportPanel />
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import {
  BookOpen,
  Check,
  Church,
  GripVertical,
  Image,
  ListChecks,
  MonitorPlay,
  Pencil,
  RefreshCcw,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-vue-next';
import GlvImportPanel from '@/components/GlvImportPanel.vue';
import OrganizationLogo from '@/components/OrganizationLogo.vue';
import OrganizationSetup from '@/components/OrganizationSetup.vue';
import SetupGuide from '@/components/SetupGuide.vue';
import TeacherPhoto from '@/components/TeacherPhoto.vue';
import { useGlvImport } from '@/composables/useGlvImport';
import { DIVISION_OPTIONS, getDivisionMeta } from '@/data/divisions';
import { uploadClassImage } from '@/services/imageService';
import { useClassesStore } from '@/stores/classes';
import { useOrganizationStore } from '@/stores/organization';

const classesStore = useClassesStore();
const organization = useOrganizationStore();
const activeSection = ref('organization');
const glv = useGlvImport();
const glvFileInput = ref(null);
const divisions = DIVISION_OPTIONS;
const editingId = ref('');
const draggedId = ref('');
const uploadingField = ref('');
const classFilterDivision = ref('');

const form = reactive(createEmptyForm());

const filteredClassList = computed(() => {
  if (!classFilterDivision.value) return classesStore.orderedClasses;
  return classesStore.orderedClasses.filter((item) => item.division === classFilterDivision.value);
});

onMounted(() => {
  classesStore.init();
});

function onDivisionChange() {
  form.primaryColor = getDivisionMeta(form.division).color;
}

function createEmptyForm() {
  const meta = getDivisionMeta('THIEU_NHI');
  return {
    className: '',
    division: 'THIEU_NHI',
    teacherName: '',
    assistantName: '',
    teacherImage: '',
    assistantImage: '',
    slogan: '',
    primaryColor: meta.color,
    notes: '',
  };
}

function resetForm() {
  Object.assign(form, createEmptyForm());
  editingId.value = '';
}

async function saveClass() {
  const payload = { ...form };
  try {
    if (editingId.value) {
      await classesStore.updateClass(editingId.value, payload);
    } else {
      await classesStore.addClass(payload);
    }
    resetForm();
  } catch (error) {
    alert(error.message);
  }
}

function editClass(classItem) {
  editingId.value = classItem.id;
  Object.assign(form, {
    className: classItem.className,
    division: classItem.division,
    teacherName: classItem.teacherName,
    assistantName: classItem.assistantName,
    teacherImage: classItem.teacherImage,
    assistantImage: classItem.assistantImage,
    slogan: classItem.slogan,
    primaryColor: classItem.primaryColor,
    notes: classItem.notes,
  });
}

async function deleteClass(classItem) {
  if (!confirm(`Xóa lớp ${classItem.className}?`)) return;
  try {
    await classesStore.deleteClass(classItem.id);
    if (editingId.value === classItem.id) resetForm();
  } catch (error) {
    alert(error.message);
  }
}

async function handleImage(event, field) {
  const file = event.target.files?.[0];
  if (!file) return;

  uploadingField.value = field;
  try {
    form[field] = await uploadClassImage(file, field);
  } catch (error) {
    alert(error.message);
  } finally {
    uploadingField.value = '';
    event.target.value = '';
  }
}

async function handleGlvFile(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  await glv.handleFile(file);
}

async function resetReveals() {
  if (!confirm('Bạn có chắc muốn đưa tất cả túi về trạng thái chưa mở?')) return;
  try {
    await classesStore.resetReveals();
  } catch (error) {
    alert(error.message);
  }
}

function dragStart(classItem) {
  draggedId.value = classItem.id;
}

async function dropOn(classItem) {
  const sourceId = draggedId.value;
  draggedId.value = '';
  try {
    await classesStore.moveClass(sourceId, classItem.id);
  } catch (error) {
    alert(error.message);
  }
}

</script>
