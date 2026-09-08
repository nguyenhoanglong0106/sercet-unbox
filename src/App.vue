<template>
  <RouterView />
</template>

<script setup>
import { watch } from 'vue';
import { ASSETS } from '@/data/divisions';
import { useOrganizationStore } from '@/stores/organization';

const organization = useOrganizationStore();
organization.init();

watch(() => organization.profile, (profile) => {
  document.title = `Nhận Lớp Giáo Lý ${profile.academicYear} | ${profile.parishName}`;
  document.documentElement.style.setProperty(
    '--organization-background',
    `url(${JSON.stringify(profile.backgroundUrl || ASSETS.background)})`,
  );
}, { immediate: true });
</script>
