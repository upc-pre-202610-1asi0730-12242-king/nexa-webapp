import { sharedRoutes } from '@/shared/presentation/shared.routes';
import { salesRoutes, salesPortalRoutes } from '@/sales/presentation/sales.routes';
import { logisticsRoutes } from '@/logistics/presentation/logistics.routes';
import { invoicingRoutes } from '@/invoicing/presentation/invoicing.routes';
import { warehouseRoutes } from '@/warehouse/presentation/warehouse.routes';
import { catalogManagementRoutes, catalogManagementPortalRoutes } from '@/catalog-management/presentation/catalog-management.routes';
import { tenantManagementOpsRoutes } from '@/tenant-management/presentation/tenant-management.routes';

export const opsRoutes = {
  path: '/ops',
  component: () => import('@/app/presentation/layouts/ops-layout.vue'),
  meta: { requiresAuth: true, scope: 'ops' },
  children: [
    { path: '', redirect: '/ops/dashboard' },
    {
      path: 'dashboard',
      name: 'ops.dashboard',
      redirect: () => {
        const user = JSON.parse(localStorage.getItem('nexa.user') || 'null');
        if (user?.roleKey === 'owner') return '/ops/operations/company-administration';
        return user?.roleKey === 'logistics' ? '/ops/operations/dashboard' : '/ops/commercial/dashboard';
      },
    },
    ...salesRoutes,
    ...invoicingRoutes,
    ...catalogManagementRoutes,
    ...warehouseRoutes,
    ...logisticsRoutes,
    ...sharedRoutes,
    ...tenantManagementOpsRoutes,
    {
      path: 'settings',
      redirect: '/ops/operations/company-administration',
    },
    { path: 'profile', name: 'ops.profile', component: () => import('@/iam/presentation/views/profile-view.vue') },
  ],
};

export const portalRoutes = {
  path: '/portal',
  component: () => import('@/app/presentation/layouts/portal-layout.vue'),
  meta: { requiresAuth: true, scope: 'portal' },
  children: [
    { path: '', redirect: '/portal/home' },
    ...salesPortalRoutes,
    ...catalogManagementPortalRoutes,
  ],
};
