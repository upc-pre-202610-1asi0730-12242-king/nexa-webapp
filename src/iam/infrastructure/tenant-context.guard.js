import { useAuthStore } from '@/iam/application/iam.store';

export function tenantContextGuard(to) {
  const auth = useAuthStore();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (!requiresAuth || !auth.isAuthenticated) return true;
  if (!auth.tenant) return { name: 'auth.login', query: { redirect: to.fullPath } };

  if (auth.tenant.status === 'suspended') {
    return {
      name: 'auth.blocked',
      query: { workspace: auth.tenant.slug || '' },
    };
  }

  return true;
}
