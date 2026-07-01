import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint';

export const TENANT_CAPABILITY_LIST = Object.freeze([
  'catalog-management',
  'sales-requests',
  'warehouse-management',
  'inventory-lots',
  'logistics-dispatch',
  'temperature-logs',
  'invoicing-payments',
  'buyer-portal',
  'workspace-operations-setup',
  'business-documents',
  'promotions',
]);

export const WORKSPACE_SETUP_CHECKLIST = Object.freeze([
  { key: 'companyProfile', done: false },
  { key: 'uploadLogo', done: false },
  { key: 'mainWarehouse', done: false },
  { key: 'temperatureRanges', done: false },
  { key: 'firstProducts', done: false },
  { key: 'inviteLogisticsTeam', done: false },
  { key: 'firstDispatch', done: false },
]);

export const SEGMENT_CONNECTIONS = Object.freeze([
  { key: 'catalog', icon: 'pi-box' },
  { key: 'sales', icon: 'pi-inbox' },
  { key: 'warehouse', icon: 'pi-database' },
  { key: 'logistics', icon: 'pi-send' },
  { key: 'invoicing', icon: 'pi-file-check' },
]);

function enrichTenant(tenant = {}) {
  return {
    ...tenant,
    id: tenant.id || null,
    branding: tenant.branding || {
      displayName: '',
      logoPreview: '',
    },
    capabilities: (tenant.capabilities || []).map(capability => capability.replaceAll('_', '-')),
    coldChainOperation: tenant.coldChainOperation || {
      temperatureRange: '',
    },
    mainWarehouse: tenant.mainWarehouse || {
      id: null,
      name: '',
      address: '',
      coldRooms: 0,
    },
    logisticsSetup: tenant.logisticsSetup || {
      fefoEnabled: false,
      temperatureAlertsEnabled: false,
      dispatchTrackingEnabled: false,
    },
  };
}

class TenantApi {
  constructor() {
    this.tenants = new BaseEndpoint('/api/v1/tenants');
    this.workspaces = new BaseEndpoint('/api/v1/workspaces');
  }

  getTenants() {
    return this.tenants.getAll().then(rows => rows.map(enrichTenant));
  }

  async getCurrentTenant(slug = 'icisa') {
    const [tenants, workspace] = await Promise.all([
      this.getTenants(),
      this.getWorkspace(slug),
    ]);
    const tenant = tenants.find(row => row.id === workspace.tenantId || row.slug === workspace.slug);
    if (!tenant) throw new Error('Current tenant was not found.');
    return enrichTenant({
      ...tenant,
      workspaceId: workspace.id,
      workspaceUrl: workspace.url,
      emailDomain: workspace.emailDomain || tenant.emailDomain,
    });
  }

  getTenantPreview(slug = 'icisa') {
    const encodedSlug = encodeURIComponent(slug);
    return this.tenants.request(
      (client) => client.get(this.tenants.pathFor(client, `/by-slug/${encodedSlug}`)).then(response => response.data),
      (data) => data && typeof data === 'object'
    ).then(enrichTenant);
  }

  getWorkspace(slug = 'icisa') {
    const encodedSlug = encodeURIComponent(slug);
    return this.workspaces.request(
      (client) => client.get(this.workspaces.pathFor(client, `/by-slug/${encodedSlug}`)).then(response => response.data),
      (data) => data && typeof data === 'object'
    );
  }

  async checkWorkspaceSlug(slug) {
    try {
      await this.getTenantPreview(slug);
      return { available: false, suggestions: [`${slug}-peru`, `${slug}-sac`, `${slug}-lima`] };
    } catch {
      return { available: Boolean(slug), suggestions: [] };
    }
  }
}

export const tenantApi = new TenantApi();
