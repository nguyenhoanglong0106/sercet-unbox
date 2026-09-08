<template>
  <section class="organization-layout" aria-labelledby="organization-heading">
    <form class="organization-form" @submit.prevent="save" novalidate>
      <div class="organization-heading">
        <h2 id="organization-heading">Thông tin xứ đoàn</h2>
        <span v-if="dirty" class="organization-unsaved">Chưa lưu thay đổi</span>
      </div>

      <p v-if="organization.loading" class="organization-status" role="status">Đang tải thông tin xứ đoàn...</p>
      <p v-else-if="organization.syncError || organization.pending" class="organization-status organization-status--warning" role="status">
        {{ organization.syncError }}
        {{ organization.pending ? 'Thông tin đang được lưu trên thiết bị này, chưa đồng bộ sang thiết bị khác.' : 'Thông tin sẽ được lưu trên thiết bị này khi chưa kết nối được máy chủ.' }}
      </p>

      <fieldset :disabled="busy">
        <div class="organization-fields">
          <label v-for="field in textFields" :key="field.key" :class="{ 'organization-field--wide': field.wide }">
            <span>{{ field.label }}{{ field.required ? ' *' : '' }}</span>
            <input
              v-model="form[field.key]"
              :name="field.key"
              type="text"
              :required="field.required"
              :maxlength="limits[field.key]"
              :placeholder="field.placeholder"
              :aria-invalid="!!errors[field.key]"
              :aria-describedby="errors[field.key] ? `organization-error-${field.key}` : undefined"
            />
            <small v-if="errors[field.key]" :id="`organization-error-${field.key}`" class="organization-error">{{ errors[field.key] }}</small>
          </label>
        </div>

        <h3>Hình ảnh</h3>
        <div class="organization-images">
          <div v-for="asset in imageFields" :key="asset.key" class="organization-image-row">
            <div class="organization-image-preview" :class="{ 'organization-image-preview--logo': asset.key === 'logoUrl' }">
              <OrganizationLogo v-if="asset.key === 'logoUrl'" :src="form[asset.key]" />
              <img v-else :key="form[asset.key]" :src="form[asset.key] || defaults[asset.key]" :alt="asset.label" @error="imageFailed($event, asset.key)" />
            </div>
            <div class="organization-image-fields">
              <label>
                <span>{{ asset.label }}</span>
                <input
                  v-model="form[asset.key]"
                  type="text"
                  inputmode="url"
                  :name="asset.key"
                  :aria-label="`Đường dẫn ${asset.label.toLowerCase()}`"
                  :aria-invalid="!!errors[asset.key]"
                  :aria-describedby="errors[asset.key] ? `organization-error-${asset.key}` : undefined"
                  placeholder="https://..."
                />
              </label>
              <div class="organization-image-actions">
                <button type="button" class="text-button" @click="imageInputs[asset.key]?.click()">
                  <Upload :size="16" />
                  {{ uploadingField === asset.key ? 'Đang tải ảnh...' : 'Tải ảnh lên' }}
                </button>
                <button
                  type="button"
                  class="icon-button"
                  :title="`Khôi phục ${asset.label.toLowerCase()} mặc định`"
                  :aria-label="`Khôi phục ${asset.label.toLowerCase()} mặc định`"
                  :disabled="form[asset.key] === defaults[asset.key]"
                  @click="restoreImage(asset.key)"
                >
                  <RotateCcw :size="16" />
                </button>
                <input
                  :ref="(element) => { imageInputs[asset.key] = element; }"
                  class="sr-only"
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.tif,.tiff"
                  :aria-label="`Tải ${asset.label.toLowerCase()}`"
                  tabindex="-1"
                  @change="uploadImage($event, asset.key)"
                />
              </div>
              <small v-if="errors[asset.key]" :id="`organization-error-${asset.key}`" class="organization-error">{{ errors[asset.key] }}</small>
            </div>
          </div>
        </div>
      </fieldset>

      <p v-if="saveError" class="organization-status organization-status--error" role="alert">{{ saveError }}</p>
      <p v-else-if="savedMessage && !dirty" class="organization-status" :class="{ 'organization-status--success': !organization.pending }" role="status">{{ savedMessage }}</p>

      <div class="organization-form-actions">
        <button class="text-button text-button--primary" type="submit" :disabled="busy || (!dirty && !organization.pending)">
          <Save :size="18" />
          {{ organization.saving ? 'Đang lưu...' : 'Lưu thông tin' }}
        </button>
        <button class="text-button" type="button" :disabled="busy || !dirty" @click="resetForm">
          <RotateCcw :size="18" />
          Hủy thay đổi
        </button>
        <button v-if="organization.pending && !dirty" class="text-button" type="button" :disabled="busy" @click="save">
          <CloudUpload :size="18" />
          Thử đồng bộ
        </button>
      </div>
    </form>

    <aside class="organization-preview" aria-label="Xem trước thông tin xứ đoàn">
      <div class="organization-heading">
        <h2>Xem trước</h2>
        <div class="segmented" aria-label="Kiểu xem trước">
          <button type="button" :class="{ active: previewMode === 'poster' }" :aria-pressed="previewMode === 'poster'" @click="previewMode = 'poster'">Poster</button>
          <button type="button" :class="{ active: previewMode === 'bag' }" :aria-pressed="previewMode === 'bag'" @click="previewMode = 'bag'">Túi</button>
        </div>
      </div>
      <div class="organization-preview-stage" :style="previewStyle">
        <ClassRevealPoster v-if="previewMode === 'poster'" :class-item="previewClass" :organization-info="previewProfile" />
        <BlindBag v-else :class-item="previewClass" :organization-info="previewProfile" hero />
      </div>
    </aside>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { CloudUpload, RotateCcw, Save, Upload } from 'lucide-vue-next';
import BlindBag from '@/components/BlindBag.vue';
import ClassRevealPoster from '@/components/ClassRevealPoster.vue';
import OrganizationLogo from '@/components/OrganizationLogo.vue';
import { DEFAULT_ORGANIZATION, ORGANIZATION_LIMITS, normalizeOrganization, validateOrganization } from '@/data/organization';
import { uploadClassImage } from '@/services/imageService';
import { useClassesStore } from '@/stores/classes';
import { useOrganizationStore } from '@/stores/organization';

const organization = useOrganizationStore();
const classesStore = useClassesStore();
const defaults = DEFAULT_ORGANIZATION;
const limits = ORGANIZATION_LIMITS;
const form = reactive({ ...organization.profile });
const errors = ref({});
const saveError = ref('');
const savedMessage = ref('');
const uploadingField = ref('');
const previewMode = ref('poster');
const imageInputs = {};
const textFields = [
  { key: 'name', label: 'Tên xứ đoàn', required: true, wide: true },
  { key: 'parishName', label: 'Giáo xứ', required: true },
  { key: 'diocese', label: 'Giáo phận', placeholder: 'Giáo phận...' },
  { key: 'academicYear', label: 'Niên khóa', required: true, placeholder: '2026 - 2027' },
  { key: 'slogan', label: 'Khẩu hiệu xứ đoàn', placeholder: 'Khẩu hiệu...' },
];
const imageFields = [
  { key: 'logoUrl', label: 'Logo xứ đoàn' },
  { key: 'backgroundUrl', label: 'Ảnh nền trình chiếu' },
  { key: 'churchImageUrl', label: 'Ảnh nhà thờ' },
];

const dirty = computed(() => JSON.stringify(normalizeOrganization(form)) !== JSON.stringify(organization.profile));
const busy = computed(() => organization.loading || organization.saving || !!uploadingField.value);
const previewProfile = computed(() => {
  const profile = normalizeOrganization(form);
  const invalid = validateOrganization(profile);
  for (const { key } of imageFields) {
    if (!profile[key] || invalid[key]) profile[key] = defaults[key];
  }
  return profile;
});
const previewClass = computed(() => classesStore.orderedClasses[0] || {
  id: 'organization-preview',
  className: 'Thiếu Nhi 1',
  division: 'THIEU_NHI',
  teacherName: 'Giáo Lý Viên',
  teacherImage: '/assets/glv-nam.jpg',
});
const previewStyle = computed(() => ({
  backgroundImage: `url(${JSON.stringify(previewProfile.value.backgroundUrl)})`,
}));

watch(() => organization.profile, (profile) => Object.assign(form, profile));

function resetForm() {
  Object.assign(form, organization.profile);
  errors.value = {};
  saveError.value = '';
  savedMessage.value = '';
}

async function save() {
  if (busy.value) return;
  errors.value = validateOrganization(normalizeOrganization(form));
  saveError.value = '';
  savedMessage.value = '';
  if (Object.keys(errors.value).length) return;
  try {
    const destination = await organization.save(form);
    savedMessage.value = destination === 'online'
      ? 'Đã lưu và đồng bộ thông tin xứ đoàn.'
      : 'Đã lưu thông tin trên thiết bị này.';
  } catch (error) {
    saveError.value = error.message;
  }
}

async function uploadImage(event, key) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file || busy.value) return;
  delete errors.value[key];
  if (file.size > 10 * 1024 * 1024) {
    errors.value[key] = 'Vui lòng chọn ảnh không quá 10 MB.';
    return;
  }
  uploadingField.value = key;
  try {
    form[key] = await uploadClassImage(file, `organization/${key}`);
  } catch (error) {
    errors.value[key] = error.message;
  } finally {
    uploadingField.value = '';
  }
}

function restoreImage(key) {
  form[key] = defaults[key];
  delete errors.value[key];
}

function imageFailed(event, key) {
  if (event.currentTarget.getAttribute('src') !== defaults[key]) {
    event.currentTarget.src = defaults[key];
  }
}

function beforeUnload(event) {
  if (!dirty.value && !uploadingField.value && !organization.saving) return;
  event.preventDefault();
  event.returnValue = '';
}

onMounted(() => window.addEventListener('beforeunload', beforeUnload));
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload));
onBeforeRouteLeave(() => {
  if (organization.saving || uploadingField.value) return false;
  return !dirty.value || window.confirm('Thông tin xứ đoàn chưa được lưu. Bạn muốn rời trang và bỏ các thay đổi?');
});
</script>
