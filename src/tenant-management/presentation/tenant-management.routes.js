export const tenantManagementPublicRoutes = [
  {
    path: '/tenant-management',
    component: () => import('@/iam/presentation/views/auth-layout.vue'),
    children: [
      {
        path: 'register-organization',
        name: 'tenant.register-organization',
        component: () => import('@/tenant-management/presentation/views/register-organization-view.vue'),
      },
    ],
  },
  {
    path: '/tenant-management/registration-pending/:id',
    name: 'tenant.registration.pending',
    component: () => import('@/tenant-management/presentation/views/registration-pending-view.vue'),
  },
];

export const tenantManagementOpsRoutes = [
  {
    path: 'operations/company-administration',
    name: 'operations-company-administration',
    component: () => import('@/tenant-management/presentation/views/company-administration-view.vue'),
    meta: { roles: ['owner'], capability: 'workspace-operations-setup' },
  },
  {
    path: 'company-administration',
    redirect: '/ops/operations/company-administration',
  },
];
