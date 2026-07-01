import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint';

const roleMap = {
  Admin: { role: 'ops', scope: 'ops', roleKey: 'commercial', roleName: 'Company Owner', department: 'Executive Office', permissions: ['*'] },
  'Company Owner': { role: 'ops', scope: 'ops', roleKey: 'owner', roleName: 'Company Owner', department: 'Executive Office', permissions: ['*'] },
  Sales: { role: 'ops', scope: 'ops', roleKey: 'commercial', roleName: 'Sales', department: 'Sales', permissions: ['catalog:read', 'catalog:write', 'sales:read', 'sales:write', 'orders:read', 'orders:write', 'documents:read', 'documents:write'] },
  Logistics: { role: 'ops', scope: 'ops', roleKey: 'logistics', roleName: 'Logistics', department: 'Logistics', permissions: ['warehouse:read', 'warehouse:write', 'logistics:read', 'logistics:write', 'shipments:read', 'shipments:write'] },
  'Logistics Manager': { role: 'ops', scope: 'ops', roleKey: 'logistics', roleName: 'Logistics Manager', department: 'Logistics', permissions: ['warehouse:read', 'warehouse:write', 'logistics:read', 'logistics:write', 'shipments:read', 'shipments:write', 'dispatch:read', 'dispatch:write'] },
  Buyer: { role: 'portal', scope: 'portal', roleKey: 'buyer', roleName: 'B2B Buyer', department: 'Purchasing', permissions: ['portal:read', 'portal:write', 'requests:read', 'requests:write', 'documents:read'] },
  'B2B Buyer': { role: 'portal', scope: 'portal', roleKey: 'buyer', roleName: 'B2B Buyer', department: 'Purchasing', permissions: ['portal:read', 'portal:write', 'requests:read', 'requests:write', 'documents:read'] },
};

const roleAliases = Object.freeze({
  CompanyOwner: 'Company Owner',
  CommercialCoordinator: 'Sales',
  'Commercial Coordinator': 'Sales',
  LogisticsManager: 'Logistics Manager',
  B2BBuyer: 'B2B Buyer',
});

function initialsFrom(email = '') {
  return email
    .split('@')[0]
    .split(/[\s._-]+/)
    .map(part => part[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2) || 'NX';
}

export function mapBackendUser(user = {}) {
  const role = user.role || user.Role || 'Sales';
  const mapped = roleMap[roleAliases[role] || role] || roleMap.Sales;
  const email = user.email || user.Email || user.username || user.Username || '';
  const fullName = user.fullName || user.FullName || user.name || user.displayName || email.split('@')[0];
  return {
    id: user.id || user.Id || email,
    username: user.username || user.Username || email,
    email,
    name: fullName,
    displayName: fullName,
    initials: initialsFrom(fullName),
    clientId: user.clientAccountId || user.ClientAccountId || null,
    phone: user.phone || user.Phone || '',
    preferredLanguage: user.preferredLanguage || user.PreferredLanguage || 'en',
    notificationPreferences: {
      critical: user.criticalNotificationsEnabled ?? user.CriticalNotificationsEnabled ?? true,
    },
    ...mapped,
  };
}

class IamApiService {
  constructor() {
    this.users = new BaseEndpoint('/api/v1/users');
    this.authentication = new BaseEndpoint('/api/v1/authentication');
  }

  getUsers() {
    return this.users.getAll().then(users => users.map(mapBackendUser));
  }

  getCurrentProfile() {
    return this.users.request(
      (client) => client.get(this.users.pathFor(client, '/me')).then(response => response.data),
      (data) => data && typeof data === 'object'
    );
  }

  updateCurrentProfile(resource) {
    return this.users.request(
      (client) => client.put(this.users.pathFor(client, '/me'), resource).then(response => response.data),
      (data) => data && typeof data === 'object'
    );
  }

  signIn({ email, password, workspaceSlug }) {
    return this.authentication.request(
      (client) => client.post(this.authentication.pathFor(client, '/sign-in'), {
        email,
        username: email,
        password,
        workspaceSlug,
      }).then(response => response.data),
      (data) => data && typeof data === 'object'
    );
  }

  findUserByEmail(email) {
    return this.getUsers().then(users =>
      users.find(user => user.email === email || (user.aliases || []).includes(email)) || null
    );
  }
}

export const iamApiService = new IamApiService();
