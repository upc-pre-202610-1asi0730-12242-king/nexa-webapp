import { createRouter, createWebHistory } from 'vue-router';
import { opsRoutes, portalRoutes } from '@/app/presentation/app-routes';
import { iamRoutes } from '@/iam/presentation/iam.routes';
import { runRouteGuardChain } from '@/iam/infrastructure/route-guard-chain';
import { tenantManagementPublicRoutes } from '@/tenant-management/presentation/tenant-management.routes';

if (window.location.pathname === '/' && window.location.hash.startsWith('#/')) {
  window.history.replaceState(null, '', window.location.hash.slice(1));
}

const routes = [
  { path: '/', redirect: '/auth/login' },
  iamRoutes,
  ...tenantManagementPublicRoutes,
  opsRoutes,
  portalRoutes,
  { path: '/:pathMatch(.*)*', redirect: '/auth/login' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 }; },
});

router.beforeEach((to, from) => runRouteGuardChain(to, from));

export default router;

