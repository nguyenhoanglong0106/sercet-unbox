<template>
  <main class="reveal-view">
    <RevealStage
      v-if="classItem"
      :key="classItem.id"
      :class-item="classItem"
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

function markComplete(item) {
  classesStore.markRevealed(item.id);
}
</script>
