import { iamApiService, mapBackendUser } from '../infrastructure/iam-api';
import { tenantApi } from '@/tenant-management/infrastructure/tenant-api';

const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'yahoo.com',
  'icloud.com',
  'live.com',
]);

function normalizeWorkspaceSlug(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function isPersonalEmail(email = '') {
  const domain = String(email).split('@')[1]?.toLowerCase() || '';
  return PERSONAL_EMAIL_DOMAINS.has(domain);
}

/**
 * IAM application use cases.
 *
 * @summary Handles authentication logic against the Nexa API.
 */
export const iamApplication = {
  /**
   * @summary Returns all users from the API contract.
   * @returns {Promise<Array>}
   */
  getUsers() {
    return iamApiService.getUsers();
  },

  getCurrentProfile() {
    return iamApiService.getCurrentProfile().then(mapBackendUser);
  },

  updateCurrentProfile(payload) {
    return iamApiService.updateCurrentProfile(payload).then(mapBackendUser);
  },

  changeCurrentPassword(payload) {
    return iamApiService.changeCurrentPassword(payload);
  },

  /**
   * @summary Resolves a tenant preview for the workspace-first login.
   * @param {string} workspaceSlug
   * @returns {Promise<Object|null>}
   */
  async resolveWorkspace(workspaceSlug) {
    const slug = normalizeWorkspaceSlug(workspaceSlug);
    if (!slug) return null;
    try {
      return await tenantApi.getTenantPreview(slug);
    } catch {
      return null;
    }
  },

  /**
   * @summary Checks whether the email domain is a personal provider.
   * @param {string} email
   * @returns {boolean}
   */
  isPersonalEmail(email) {
    return isPersonalEmail(email);
  },

  /**
   * @summary Verifies workspace-first credentials against the backend and returns a session.
   * @param {string} workspaceSlug
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object|null>} Session record or null on mismatch.
   */
  async verifyWorkspaceCredentials({ workspaceSlug, email, password }) {
    const tenant = await this.resolveWorkspace(workspaceSlug);
    if (tenant && tenant.status !== 'active') return { tenant, suspended: true };

    const authenticatedUser = await iamApiService.signIn({ email, password, workspaceSlug: tenant?.slug || workspaceSlug });
    const user = mapBackendUser(authenticatedUser);
    const resolvedTenant = {
      ...(tenant || {}),
      id: authenticatedUser.tenantId,
      slug: authenticatedUser.workspaceSlug || tenant?.slug || normalizeWorkspaceSlug(workspaceSlug),
      workspaceId: authenticatedUser.workspaceId,
      workspaceUrl: tenant?.workspaceUrl || `${authenticatedUser.workspaceSlug || normalizeWorkspaceSlug(workspaceSlug)}.nexa.com.pe`,
      status: authenticatedUser.workspaceStatus || tenant?.status || 'active',
      plan: tenant?.plan || 'Standard',
    };

    return {
      accessToken: authenticatedUser.accessToken || authenticatedUser.AccessToken,
      user,
      tenant: resolvedTenant,
      membership: {
        tenantId: authenticatedUser.tenantId || resolvedTenant.id,
        workspaceId: authenticatedUser.workspaceId || resolvedTenant.workspaceId,
        workspaceSlug: authenticatedUser.workspaceSlug || resolvedTenant.slug,
        userId: user.id,
        role: user.roleName,
        roleKey: user.roleKey,
        scope: user.scope,
        permissions: user.permissions,
        clientAccountId: authenticatedUser.clientAccountId || authenticatedUser.ClientAccountId || null,
        status: authenticatedUser.membershipStatus || 'active',
      },
    };
  },
};
