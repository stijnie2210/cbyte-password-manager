import { createRouter, createWebHistory } from 'vue-router';
import ShareSecretView from '../views/ShareSecretView.vue';
import ViewSecretView from '../views/ViewSecretView.vue';

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'share', component: ShareSecretView },
    { path: '/s/:id', name: 'view-secret', component: ViewSecretView, props: true },
  ],
});
