import { createRouter, createWebHistory } from 'vue-router';
import SetupView from '@/views/SetupView.vue';
import PresenterView from '@/views/PresenterView.vue';
import RevealView from '@/views/RevealView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/presenter' },
    { path: '/setup', name: 'setup', component: SetupView },
    { path: '/presenter', name: 'presenter', component: PresenterView },
    { path: '/reveal/:id', name: 'reveal', component: RevealView, props: true },
    {
      path: '/ket-qua',
      name: 'results',
      component: () => import('@/views/ResultsView.vue'),
    },
  ],
});

export default router;
