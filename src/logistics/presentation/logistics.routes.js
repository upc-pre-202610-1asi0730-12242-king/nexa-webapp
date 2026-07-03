export const logisticsRoutes = [
  {
    path: 'operations/dashboard',
    name: 'ops.operations.dashboard',
    component: () => import('@/logistics/presentation/dispatch-orders/views/operations-dashboard-view.vue'),
    meta: { roles: ['logistics'] },
  },
  {
    path: 'operations/dispatch-orders',
    name: 'operations-dispatch-orders',
    component: () => import('@/logistics/presentation/dispatch-orders/views/dispatch-board-view.vue'),
    meta: { roles: ['logistics'] },
  },
  {
    path: 'operations/dispatch-orders/:id',
    name: 'operations-dispatch-order-detail',
    component: () => import('@/logistics/presentation/dispatch-orders/views/dispatch-detail-view.vue'),
    meta: { roles: ['logistics'] },
  },
  {
    path: 'operations/proof-of-delivery',
    name: 'operations-proof-of-delivery',
    component: () => import('@/logistics/presentation/dispatch-orders/views/evidence-view.vue'),
    meta: { roles: ['logistics'] },
  },
  {
    path: 'operations/workspace-setup',
    name: 'operations-workspace-setup',
    redirect: '/ops/operations/company-administration?section=workspaces',
  },
  {
    path: 'dispatch',
    redirect: '/ops/operations/dispatch-orders',
  },
  {
    path: 'dispatch/:id',
    redirect: to => `/ops/operations/dispatch-orders/${to.params.id}`,
  },
  {
    path: 'evidence',
    redirect: '/ops/operations/proof-of-delivery',
  },
];
