export const invoicingRoutes = [
  {
    path: 'commercial/business-documents/orders/:orderId',
    name: 'commercial-business-document-order-detail',
    component: () => import('@/invoicing/presentation/business-documents/views/business-document-order-detail-view.vue'),
    meta: { roles: ['commercial'] },
  },
  {
    path: 'commercial/business-documents',
    name: 'commercial-business-documents',
    component: () => import('@/invoicing/presentation/business-documents/views/business-documents-center-view.vue'),
    meta: { roles: ['commercial'] },
  },
  {
    path: 'operations/business-documents/orders/:orderId',
    name: 'operations-business-document-order-detail',
    component: () => import('@/invoicing/presentation/business-documents/views/business-document-order-detail-view.vue'),
    meta: { roles: ['logistics'] },
  },
  {
    path: 'operations/business-documents',
    name: 'operations-business-documents',
    component: () => import('@/invoicing/presentation/business-documents/views/business-documents-center-view.vue'),
    meta: { roles: ['logistics'] },
  },
  {
    path: 'commercial/documents',
    redirect: '/ops/commercial/business-documents',
  },
];
