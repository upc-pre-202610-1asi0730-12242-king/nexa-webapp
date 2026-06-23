import { useAuthStore } from '@/iam/application/iam.store';

const TENANT_ROLE_DASHBOARD_MAP = Object.freeze({
  CompanyOwner: 'commercial',
  CommercialCoordinator: 'commercial',
  LogisticsManager: 'logistics',
  B2BBuyer: 'buyer',
});

const ROLE_KEY_DASHBOARD_MAP = Object.freeze({
  admin: 'commercial',
  owner: 'owner',
});

function compatibleRole(auth) {
  const membershipRole = auth.membership?.role;
  const roleKey = auth.user?.roleKey;
  return ROLE_KEY_DASHBOARD_MAP[roleKey] || TENANT_ROLE_DASHBOARD_MAP[membershipRole] || roleKey || 'commercial';
}

export function roleAuthorizationGuard(to) {
  const auth = useAuthStore();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  if (!requiresAuth || !auth.isAuthenticated) return true;

  const scopeRecord = to.matched.find(record => record.meta.scope);
  const requiredScope = scopeRecord?.meta.scope;
  if (requiredScope && auth.scope !== requiredScope) {
    return { name: 'auth.forbidden', query: { from: to.fullPath, required: requiredScope } };
  }

  const rolesRecord = to.matched.find(record => record.meta.roles);
  if (!rolesRecord) return true;

  const userRole = compatibleRole(auth);
  if (rolesRecord.meta.roles.includes(userRole)) return true;

  const fallbackPath = userRole === 'owner'
    ? '/ops/operations/company-administration'
    : userRole === 'logistics'
      ? '/ops/operations/dashboard'
      : '/ops/commercial/dashboard';

  if (to.path === fallbackPath) {
    return { name: 'auth.forbidden', query: { from: to.fullPath, role: userRole } };
  }

  return { path: fallbackPath };
}

