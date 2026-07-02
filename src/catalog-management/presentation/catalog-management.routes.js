export const catalogManagementRoutes = [
  {
    path: 'product-catalog',
    name: 'ops-product-catalog',
    component: () => import('@/catalog-management/presentation/product-catalog/views/catalog-view.vue'),
    meta: { roles: ['commercial'] },
  },
  {
    path: 'commercial/promotions',
    name: 'commercial-promotions',
    component: () => import('@/catalog-management/presentation/promotions/views/promotions-manager-view.vue'),
    meta: { roles: ['owner'] },
  },
  { path: 'catalog', redirect: '/ops/product-catalog' },
  { path: 'operations/promotions', redirect: '/ops/commercial/promotions' },
];

export const catalogManagementPortalRoutes = [
  {
    path: 'product-catalog',
    name: 'buyer-product-catalog',
    component: () => import('@/catalog-management/presentation/product-catalog/views/buyer-catalog-view.vue'),
  },
  {
    path: 'product-catalog/:id',
    name: 'buyer-product-catalog-detail',
    component: () => import('@/catalog-management/presentation/product-catalog/views/buyer-product-detail-view.vue'),
  },
  { path: 'catalog', redirect: '/portal/product-catalog' },
  { path: 'catalog/:id', redirect: to => `/portal/product-catalog/${to.params.id}` },
];
