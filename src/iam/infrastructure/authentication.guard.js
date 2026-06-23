import { useAuthStore } from '@/iam/application/iam.store';

export function authenticationGuard(to) {
  const auth = useAuthStore();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (!requiresAuth || auth.isAuthenticated) return true;

  return {
    name: 'auth.login',
    query: { redirect: to.fullPath },
  };
}

