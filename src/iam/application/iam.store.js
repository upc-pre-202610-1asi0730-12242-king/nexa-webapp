import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { iamApplication } from '@/iam/application/iam.application';
import { useCartStore } from '@/app/application/stores/cart.store';

export const useAuthStore = defineStore('auth', () => {
  const storedUser = JSON.parse(localStorage.getItem('nexa.user') || 'null');
  const storedTenant = JSON.parse(localStorage.getItem('nexa.tenant') || 'null');
  const storedMembership = JSON.parse(localStorage.getItem('nexa.membership') || 'null');
  const hiddenAdminSession = storedUser?.segment === 'ADMIN' && !storedTenant;
  if (hiddenAdminSession) {
    localStorage.removeItem('nexa.user');
    localStorage.removeItem('nexa.token');
    localStorage.removeItem('nexa.scope');
    localStorage.removeItem('nexa.tenant');
    localStorage.removeItem('nexa.membership');
  }

  const user  = ref(hiddenAdminSession ? null : storedUser);
  const token = ref(hiddenAdminSession ? null : localStorage.getItem('nexa.token') || null);
  const scope = ref(hiddenAdminSession ? 'ops' : localStorage.getItem('nexa.scope') || 'ops');
  const tenant = ref(hiddenAdminSession ? null : storedTenant);
  const membership = ref(hiddenAdminSession ? null : storedMembership);
  const workspaceUsers = ref([]);

  const isAuthenticated = computed(() => !!token.value);
  const permissions = computed(() => membership.value?.permissions || []);
  const role = computed(() => membership.value?.role || user.value?.roleName || user.value?.roleKey || '');

  async function login({ workspaceSlug, email, password }) {
    if (!workspaceSlug || !email || !password) throw new Error('Missing credentials');
    const previousScope = [
      tenant.value?.id || tenant.value?.slug || 'tenant',
      user.value?.clientId || user.value?.id || 'user',
    ].join(':');

    const session = await iamApplication.verifyWorkspaceCredentials({ workspaceSlug, email, password });

    if (!session) throw new Error('Invalid credentials');
    if (!session.accessToken) throw new Error('Authentication token missing');
    if (session.suspended) {
      const error = new Error('Workspace suspended');
      error.code = 'WORKSPACE_SUSPENDED';
      error.tenant = session.tenant;
      throw error;
    }

    const found = session.user;
    const sessionUser = {
      id:         found.id,
      name:       found.name || found.displayName,
      displayName: found.displayName || found.name,
      email:      found.email,
      username:   found.username || found.email,
      role:       found.role || found.scope || 'ops',
      scope:      found.scope || found.role || 'ops',
      initials:   found.initials,
      clientId:   found.clientId || null,
      roleKey:    found.roleKey || 'commercial',
      roleName:   found.roleName || 'Operator',
      department: found.department || '',
      phone:      found.phone || '',
      preferredLanguage: found.preferredLanguage || found.locale || 'en',
      planAccess: found.planAccess || session.tenant?.plan || 'standard',
      notificationPreferences: found.notificationPreferences || {},
      accessToken: session.accessToken,
    };

    scope.value = found.scope || found.role || 'ops';
    user.value  = sessionUser;
    tenant.value = session.tenant;
    membership.value = session.membership;
    token.value = session.accessToken;
    localStorage.setItem('nexa.user',  JSON.stringify(sessionUser));
    localStorage.setItem('nexa.token', token.value);
    localStorage.setItem('nexa.scope', scope.value);
    localStorage.setItem('nexa.tenant', JSON.stringify(tenant.value));
    localStorage.setItem('nexa.membership', JSON.stringify(membership.value));

    const nextScope = [
      tenant.value?.id || tenant.value?.slug || 'tenant',
      user.value?.clientId || user.value?.id || 'user',
    ].join(':');
    const cart = useCartStore();
    if (previousScope !== nextScope) cart.clearDraft();
    else cart.reloadDraft();
  }

  function logout() {
    useCartStore().clearDraft();
    user.value  = null;
    token.value = null;
    scope.value = 'ops';
    tenant.value = null;
    membership.value = null;
    localStorage.removeItem('nexa.user');
    localStorage.removeItem('nexa.token');
    localStorage.removeItem('nexa.scope');
    localStorage.removeItem('nexa.tenant');
    localStorage.removeItem('nexa.membership');
  }

  async function loadWorkspaceUsers() {
    workspaceUsers.value = await iamApplication.getUsers();
    return workspaceUsers.value;
  }

  return {
    user,
    token,
    scope,
    tenant,
    membership,
    permissions,
    role,
    workspaceUsers,
    isAuthenticated,
    login,
    logout,
    loadWorkspaceUsers,
  };
});
