<template>
  <main class="reveal-view">
    <RevealStage
      v-if="classItem"
      :key="`${classItem.id}-${glvName}`"
      :class-item="classItem"
      :glv-name="glvName"
      @complete="markComplete"
      @back="router.push('/presenter')"
    />
    <section v-else class="not-found">
      <h1>Không tìm thấy lớp</h1>
      <RouterLink class="text-button text-button--primary" to="/presenter">
        <MonitorPlay :size="18" />
        Về presenter
      </RouterLink>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { MonitorPlay } from 'lucide-vue-next';
import RevealStage from '@/components/RevealStage.vue';
import { useClassesStore } from '@/stores/classes';

const route = useRoute();
const router = useRouter();
const classesStore = useClassesStore();

onMounted(() => {
  classesStore.init();
});

const classItem = computed(() => classesStore.byId(route.params.id));
// Tên GLV đi kèm khi mở túi mù từ luồng tra cứu Giáo Lý Viên.
const glvName = computed(() => String(route.query.glv || ''));

function markComplete(item) {
  // Chế độ GLV chỉ tra cứu lớp phụ trách, không đụng tới trạng thái túi mù của
  // buổi phát cho thiếu nhi.
  if (glvName.value) return;
  classesStore.markRevealed(item.id);
}
</script>
