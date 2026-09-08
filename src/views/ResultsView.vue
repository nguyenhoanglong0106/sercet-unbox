<template>
  <main class="results-view">
    <header class="results-topbar">
      <OrganizationLogo :src="organization.profile.logoUrl" />
      <div>
        <span>{{ organization.profile.name }}</span>
        <span>{{ organization.profile.parishName }}</span>
        <h1>Danh Sách Lớp Giáo Lý {{ organization.profile.academicYear }}</h1>
      </div>
    </header>

    <p v-if="classesStore.busy && !classesStore.hydrated" class="setup-status">Đang tải danh sách lớp...</p>
    <p v-else-if="classesStore.error" class="setup-status setup-status--error">
      Không tải được dữ liệu: {{ classesStore.error }}
    </p>
    <p v-else-if="!classesStore.orderedClasses.length" class="setup-status">Chưa có lớp nào được công bố.</p>

    <section v-else class="results-grid">
      <ClassRevealPoster
        v-for="classItem in classesStore.orderedClasses"
        :key="classItem.id"
        :class-item="classItem"
      />
    </section>
  </main>
</template>

<script setup>
import { onMounted } from 'vue';
import ClassRevealPoster from '@/components/ClassRevealPoster.vue';
import OrganizationLogo from '@/components/OrganizationLogo.vue';
import { useClassesStore } from '@/stores/classes';
import { useOrganizationStore } from '@/stores/organization';

const classesStore = useClassesStore();
const organization = useOrganizationStore();

onMounted(() => {
  classesStore.init();
});

</script>
