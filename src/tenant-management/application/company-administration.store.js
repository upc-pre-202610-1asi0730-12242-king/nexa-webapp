import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  SEGMENT_CONNECTIONS,
  tenantApi,
  WORKSPACE_SETUP_CHECKLIST,
} from '@/tenant-management/infrastructure/tenant-api';
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint';

const tenantMembersApi = new BaseEndpoint('/api/v1/tenant-members');
const tenantRulesApi = new BaseEndpoint('/api/v1/tenant-rules');
const tenantCustomFieldsApi = new BaseEndpoint('/api/v1/tenant-custom-fields');
const tenantSubscriptionsApi = new BaseEndpoint('/api/v1/tenant-subscriptions');
const workspaceFeaturesApi = new BaseEndpoint('/api/v1/workspace-features');
const userWorkspaceMembershipsApi = new BaseEndpoint('/api/v1/user-workspace-memberships');
const usersApi = new BaseEndpoint('/api/v1/users');
const workspacesApi = new BaseEndpoint('/api/v1/workspaces');
const workspacePreferencesApi = new BaseEndpoint('/api/v1/workspace-preferences');
const warehousesApi = new BaseEndpoint('/api/v1/warehouses');
const tenantsApi = new BaseEndpoint('/api/v1/tenants');

const DEFAULT_PREFERENCES = Object.freeze({});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function roleKeyFor(role = '') {
  const normalized = String(role).toLowerCase();
  if (normalized.includes('logistics')) return 'logistics';
  if (normalized.includes('buyer')) return 'buyer';
  if (normalized.includes('owner')) return 'admin';
  if (normalized.includes('commercial') || normalized.includes('sales')) return 'commercial';
  return 'viewer';
}

function forTenant(rows, tenantId) {
  return rows.filter(row => !tenantId || Number(row.tenantId ?? row.TenantId) === Number(tenantId));
}

function mapTeammate(row, tenant) {
  const name = row.fullName || row.FullName || '';
  const email = row.email || row.Email || '';
  return {
    id: row.id || row.Id || email,
    name,
    email,
    role: row.role || row.Role || 'Viewer',
    roleKey: roleKeyFor(row.role || row.Role),
    department: row.department || row.Department || 'Operations',
    workspaceAccess: tenant?.slug || 'icisa',
    status: row.status || row.Status || 'active',
    portalAccess: Boolean(row.portalAccess ?? row.PortalAccess),
    clientAccountId: row.clientAccountId ?? row.ClientAccountId ?? null,
  };
}

function nameFromEmail(email = '') {
  return email
    .split('@')[0]
    .split(/[._-]+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function mapWorkspaceMembership(row, user, workspace) {
  const email = row.email || row.Email || user?.email || '';
  const role = row.role || row.Role || user?.role || 'Viewer';
  return {
    id: row.id || row.Id || `${workspace?.slug || 'workspace'}-${email}`,
    userId: row.userId || row.UserId || user?.id,
    workspaceId: row.workspaceId || row.WorkspaceId || workspace?.id,
    name: row.fullName || row.FullName || user?.name || user?.displayName || nameFromEmail(email),
    email,
    role,
    roleKey: roleKeyFor(role),
    department: row.department || row.Department || '',
    workspaceAccess: workspace?.slug || 'icisa',
    status: row.status || row.Status || 'active',
    portalAccess: Boolean(row.portalAccess ?? row.PortalAccess),
    clientAccountId: row.clientAccountId ?? row.ClientAccountId ?? null,
  };
}

function mapRule(row) {
  return {
    backendId: row.id || row.Id,
    key: row.code || row.Code || `rule-${row.id || row.Id}`,
    title: row.name || row.Name || '',
    description: row.description || row.Description || '',
    category: row.category || row.Category || 'operations',
    status: (row.enabled ?? row.Enabled ?? true) ? 'enabled' : 'disabled',
  };
}

function mapCustomField(row) {
  return {
    backendId: row.id || row.Id,
    id: row.code || row.Code || `field-${row.id || row.Id}`,
    label: row.label || row.Label || '',
    target: row.targetResource || row.TargetResource || 'Product',
    type: row.fieldType || row.FieldType || 'Text',
    required: Boolean(row.required ?? row.Required),
    status: (row.enabled ?? row.Enabled ?? true) ? 'enabled' : 'disabled',
  };
}

function mapBilling(row = {}, tenant = {}) {
  return {
    id: row.id || row.Id || null,
    tenantId: row.tenantId || row.TenantId || tenant.id || null,
    plan: row.plan || row.Plan || tenant.plan || 'Standard',
    seats: row.seats ?? row.Seats ?? 0,
    warehouses: row.warehouses ?? row.Warehouses ?? tenant.mainWarehouse?.warehouses ?? 1,
    paymentStatus: row.paymentStatus || row.PaymentStatus || 'review_active',
    nextBillingDate: row.nextBillingDate || row.NextBillingDate || '',
    billingContact: row.billingContact || row.BillingContact || '',
  };
}

function mapFeatureChecklist(features = []) {
  if (!features.length) return clone(WORKSPACE_SETUP_CHECKLIST);
  const enabledCodes = new Set(features.filter(item => item.enabled ?? item.Enabled ?? true).map(item => item.code || item.Code));
  return WORKSPACE_SETUP_CHECKLIST.map(item => ({
    ...item,
    done: enabledCodes.has(item.key) || enabledCodes.has(item.key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)),
  }));
}

function preferenceValue(row) {
  const value = row.value ?? row.Value ?? '';
  const type = String(row.valueType ?? row.ValueType ?? 'string').toLowerCase();
  if (type === 'boolean') return String(value).toLowerCase() === 'true';
  if (type === 'number') return Number(value);
  return value;
}

function preferenceType(value) {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  return 'string';
}

function formatTemperatureRange(warehouse) {
  if (!warehouse) return '';
  return `${warehouse.minimumTemperature}°C to ${warehouse.maximumTemperature}°C`;
}

function parseTemperatureRange(value, fallback) {
  const values = String(value || '').match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
  return {
    minimumTemperature: values[0] ?? Number(fallback?.minimumTemperature ?? 0),
    maximumTemperature: values[1] ?? Number(fallback?.maximumTemperature ?? 0),
  };
}

function mapWorkspace(row = {}) {
  return {
    id: row.id || row.Id,
    tenantId: row.tenantId || row.TenantId,
    name: row.name || row.Name || '',
    slug: row.slug || row.Slug || '',
    url: row.url || row.Url || '',
    workspaceUrl: row.url || row.Url || '',
    emailDomain: row.emailDomain || row.EmailDomain || '',
    status: row.status || row.Status || 'active',
    isPrimary: Boolean(row.isPrimary ?? row.IsPrimary),
  };
}

export const useCompanyAdministrationStore = defineStore('companyAdministration', () => {
  const tenant = ref(null);
  const teammates = ref([]);
  const rules = ref([]);
  const customFields = ref([]);
  const billing = ref(mapBilling());
  const billingSaving = ref(false);
  const billingError = ref('');
  const preferences = ref({ ...DEFAULT_PREFERENCES });
  const checklist = ref(clone(WORKSPACE_SETUP_CHECKLIST));
  const segmentConnections = ref(clone(SEGMENT_CONNECTIONS));
  const workspaces = ref([]);
  const preferenceRows = ref([]);
  const warehouses = ref([]);

  const setupProgress = computed(() =>
    Math.round((checklist.value.filter(item => item.done).length / checklist.value.length) * 100)
  );

  async function load(slug = 'icisa') {
    tenant.value = await tenantApi.getCurrentTenant(slug);
    const [memberRows, ruleRows, customFieldRows, subscriptionRows, featureRows, membershipRows, userRows, workspaceRows, storedPreferences, warehouseRows] = await Promise.all([
      tenantMembersApi.getAll(),
      tenantRulesApi.getAll(),
      tenantCustomFieldsApi.getAll(),
      tenantSubscriptionsApi.getAll(),
      workspaceFeaturesApi.getAll(),
      userWorkspaceMembershipsApi.getAll(),
      usersApi.getAll(),
      workspacesApi.getAll(),
      workspacePreferencesApi.getAll(),
      warehousesApi.getAll(),
    ]);
    const tenantId = tenant.value?.id;
    workspaces.value = forTenant(workspaceRows, tenantId).map(mapWorkspace);
    const currentWorkspace = workspaces.value.find(row => Number(row.id) === Number(tenant.value?.workspaceId)) || workspaces.value[0] || null;
    preferenceRows.value = storedPreferences.filter(row => Number(row.workspaceId ?? row.WorkspaceId) === Number(currentWorkspace?.id));
    preferences.value = Object.fromEntries(preferenceRows.value.map(row => [row.key || row.Key, preferenceValue(row)]));
    warehouses.value = warehouseRows;
    const mainWarehouse = warehouseRows[0] || null;
    tenant.value.mainWarehouse = {
      id: mainWarehouse?.id || null,
      name: mainWarehouse?.name || '',
      address: mainWarehouse?.location || '',
      coldRooms: Number(preferences.value.coldRooms || 0),
    };
    tenant.value.coldChainOperation = {
      temperatureRange: formatTemperatureRange(mainWarehouse),
    };
    tenant.value.logisticsSetup = {
      fefoEnabled: Boolean(preferences.value.fefoEnabled),
      temperatureAlertsEnabled: Boolean(preferences.value.temperatureAlertsEnabled),
      dispatchTrackingEnabled: Boolean(preferences.value.dispatchTrackingEnabled),
    };
    tenant.value.branding = {
      displayName: preferences.value.brandingDisplayName || tenant.value.name,
      logoPreview: preferences.value.brandingLogoUrl || '',
      backgroundPreview: preferences.value.brandingBackgroundUrl || '',
      workspaceImage: preferences.value.workspaceImageUrl || '',
    };
    const usersById = new Map(userRows.map(user => [Number(user.id), user]));
    const workspaceMemberships = membershipRows.filter(row =>
      Number(row.workspaceId ?? row.WorkspaceId) === Number(currentWorkspace?.id)
    );
    teammates.value = workspaceMemberships.length
      ? workspaceMemberships.map(row => mapWorkspaceMembership(row, usersById.get(Number(row.userId ?? row.UserId)), currentWorkspace))
      : forTenant(memberRows, tenantId).map(row => mapTeammate(row, tenant.value));
    tenant.value.memberCount = teammates.value.length;
    tenant.value.workspaces = workspaces.value;
    rules.value = forTenant(ruleRows, tenantId).map(mapRule);
    customFields.value = forTenant(customFieldRows, tenantId).map(mapCustomField);
    billing.value = mapBilling(forTenant(subscriptionRows, tenantId)[0], tenant.value);
    checklist.value = mapFeatureChecklist(forTenant(featureRows, tenantId));
    tenant.value.capabilities = forTenant(featureRows, tenantId)
      .filter(row => row.enabled ?? row.Enabled ?? true)
      .map(row => (row.code || row.Code).replaceAll('_', '-'));
    return tenant.value;
  }

  function nextId(prefix, rows) {
    return `${prefix}_${Date.now().toString(36)}_${rows.length + 1}`;
  }

  function currentWorkspace() {
    return workspaces.value.find(row => Number(row.id) === Number(tenant.value?.workspaceId)) || workspaces.value[0] || null;
  }

  function emailForWorkspace(email = '') {
    const normalized = String(email).trim().toLowerCase();
    if (normalized.includes('@')) return normalized;
    const domain = tenant.value?.emailDomain || currentWorkspace()?.emailDomain || 'empresa.pe';
    return `${normalized}@${domain}`;
  }

  function tenantResource(overrides = {}) {
    return {
      name: overrides.name ?? tenant.value.name,
      legalName: overrides.legalName ?? tenant.value.legalName ?? tenant.value.name,
      slug: tenant.value.slug,
      ruc: tenant.value.ruc || '',
      workspaceUrl: overrides.workspaceUrl ?? tenant.value.workspaceUrl,
      emailDomain: overrides.emailDomain ?? tenant.value.emailDomain,
      plan: overrides.plan ?? tenant.value.plan,
      status: tenant.value.status || 'active',
      country: overrides.country ?? tenant.value.country,
    };
  }

  async function savePreference(key, value) {
    const workspace = currentWorkspace();
    if (!workspace) throw new Error('Workspace is required before updating preferences.');
    const resource = {
      tenantId: Number(tenant.value.id),
      workspaceId: Number(workspace.id),
      key,
      value: String(value ?? ''),
      valueType: preferenceType(value),
    };
    const existing = preferenceRows.value.find(row => (row.key || row.Key) === key);
    const saved = existing
      ? await workspacePreferencesApi.update(existing.id || existing.Id, resource)
      : await workspacePreferencesApi.create(resource);
    if (existing) Object.assign(existing, saved);
    else preferenceRows.value.push(saved);
    preferences.value[key] = preferenceValue(saved);
    return saved;
  }

  async function savePreferences(payload) {
    await Promise.all(Object.entries(payload).map(([key, value]) => savePreference(key, value)));
    return preferences.value;
  }

  async function updateCompanyProfile(payload) {
    const savedTenant = await tenantsApi.update(tenant.value.id, tenantResource({
      name: payload.name,
      country: payload.country,
    }));
    Object.assign(tenant.value, savedTenant);
    await savePreferences({
      brandingDisplayName: payload.displayName ?? tenant.value.branding?.displayName ?? tenant.value.name,
      brandingLogoUrl: payload.logoPreview ?? tenant.value.branding?.logoPreview ?? '',
    });
    tenant.value.branding = {
      displayName: preferences.value.brandingDisplayName || tenant.value.name,
      logoPreview: preferences.value.brandingLogoUrl || '',
      backgroundPreview: preferences.value.brandingBackgroundUrl || '',
      workspaceImage: preferences.value.workspaceImageUrl || '',
    };
    return tenant.value;
  }

  async function updateWorkspace(payload) {
    const workspace = payload.workspaceId
      ? workspaces.value.find(row => Number(row.id) === Number(payload.workspaceId))
      : currentWorkspace();
    if (!workspace) throw new Error('Workspace is required before updating it.');
    const url = payload.slug ? `${payload.slug}.nexa.com.pe` : workspace.url;
    const savedWorkspace = await workspacesApi.update(workspace.id, {
      tenantId: Number(tenant.value.id),
      name: payload.name ?? workspace.name,
      slug: payload.slug ?? workspace.slug,
      url,
      emailDomain: workspace.emailDomain || tenant.value.emailDomain,
      status: workspace.status || 'active',
      isPrimary: workspace.isPrimary ?? false,
    });
    Object.assign(workspace, mapWorkspace(savedWorkspace));

    const updatesCurrentWorkspace = Number(workspace.id) === Number(tenant.value?.workspaceId) || Boolean(workspace.isPrimary);
    if (!updatesCurrentWorkspace) {
      tenant.value.workspaces = workspaces.value;
      return workspace;
    }

    const savedTenant = await tenantsApi.update(tenant.value.id, tenantResource({
      name: payload.name,
      workspaceUrl: url,
      plan: payload.plan,
    }));
    Object.assign(tenant.value, savedTenant, {
      workspaceId: savedWorkspace.id,
      workspaceUrl: savedWorkspace.url,
    });

    const warehouse = warehouses.value[0];
    if (warehouse) {
      const range = parseTemperatureRange(payload.temperatureRange, warehouse);
      const savedWarehouse = await warehousesApi.update(warehouse.id, {
        name: payload.mainWarehouse ?? warehouse.name,
        location: warehouse.location,
        ...range,
      });
      Object.assign(warehouse, savedWarehouse);
    }

    await savePreferences({
      coldRooms: Number(payload.coldRooms ?? tenant.value.mainWarehouse?.coldRooms ?? 0),
      fefoEnabled: Boolean(payload.fefoEnabled),
      temperatureAlertsEnabled: Boolean(payload.temperatureAlertsEnabled),
      dispatchTrackingEnabled: Boolean(payload.dispatchTrackingEnabled),
      brandingLogoUrl: payload.logoPreview ?? tenant.value.branding?.logoPreview ?? '',
      brandingBackgroundUrl: payload.backgroundPreview ?? tenant.value.branding?.backgroundPreview ?? '',
      workspaceImageUrl: payload.workspaceImage ?? tenant.value.branding?.workspaceImage ?? '',
    });
    tenant.value.mainWarehouse = {
      ...tenant.value.mainWarehouse,
      id: warehouse?.id || null,
      name: warehouse?.name || payload.mainWarehouse || '',
      address: warehouse?.location || '',
      coldRooms: Number(preferences.value.coldRooms || 0),
    };
    tenant.value.coldChainOperation = {
      temperatureRange: formatTemperatureRange(warehouse),
    };
    tenant.value.logisticsSetup = {
      fefoEnabled: Boolean(preferences.value.fefoEnabled),
      temperatureAlertsEnabled: Boolean(preferences.value.temperatureAlertsEnabled),
      dispatchTrackingEnabled: Boolean(preferences.value.dispatchTrackingEnabled),
    };
    tenant.value.branding = {
      displayName: preferences.value.brandingDisplayName || tenant.value.name,
      logoPreview: preferences.value.brandingLogoUrl || '',
      backgroundPreview: preferences.value.brandingBackgroundUrl || '',
      workspaceImage: preferences.value.workspaceImageUrl || '',
    };
    return tenant.value;
  }

  async function createWorkspace(payload) {
    const tenantId = Number(tenant.value?.id || 0);
    if (!tenantId) throw new Error('Tenant is required before creating a workspace.');
    const slug = String(payload.slug || '').trim().toLowerCase();
    if (!slug) throw new Error('Workspace slug is required.');
    const saved = await workspacesApi.create({
      tenantId,
      name: payload.name || 'New workspace',
      slug,
      url: payload.url || `${slug}.nexa.com.pe`,
      emailDomain: payload.emailDomain || tenant.value.emailDomain || `${slug}.nexa.com.pe`,
      status: payload.status || 'active',
      isPrimary: false,
    });
    const workspace = mapWorkspace(saved);
    workspaces.value.push(workspace);
    tenant.value.workspaces = workspaces.value;
    return workspace;
  }

  async function addTeammate(payload) {
    const workspace = currentWorkspace();
    if (!workspace) throw new Error('Workspace is required before creating users.');
    if (!payload.password) throw new Error('Password is required before creating users.');
    const email = emailForWorkspace(payload.email);
    const name = `${payload.firstName || ''} ${payload.lastName || ''}`.trim() || payload.name || nameFromEmail(email);
    const user = await usersApi.create({
      username: email.split('@')[0],
      email,
      password: payload.password,
      role: payload.role || 'Viewer',
    });
    const tenantId = Number(tenant.value?.id || workspace.tenantId);
    if (!Number.isFinite(tenantId) || tenantId <= 0) {
      throw new Error('Tenant is required before creating workspace membership.');
    }
    const membership = await userWorkspaceMembershipsApi.create({
      tenantId,
      workspaceId: workspace.id,
      userId: user.id,
      email,
      fullName: name,
      role: payload.role || 'Viewer',
      department: payload.department || '',
      status: payload.status || 'invited',
      portalAccess: payload.role === 'B2B Buyer',
      clientAccountId: payload.clientAccountId || null,
    });
    const teammate = mapWorkspaceMembership(membership, { ...user, name }, workspace);
    teammate.department = payload.department || teammate.department;
    teammates.value.unshift(teammate);
    tenant.value.memberCount = teammates.value.length;
    return teammate;
  }

  async function updateTeammate(id, payload) {
    const teammate = teammates.value.find(item => item.id === id);
    if (!teammate) return null;
    const saved = await userWorkspaceMembershipsApi.update(id, {
      tenantId: Number(tenant.value.id),
      workspaceId: Number(teammate.workspaceId),
      userId: Number(teammate.userId),
      email: teammate.email,
      fullName: payload.name || teammate.name,
      role: payload.role || teammate.role,
      department: payload.department ?? teammate.department,
      status: payload.status || teammate.status,
      portalAccess: payload.role === 'B2B Buyer' || Boolean(payload.portalAccess),
      clientAccountId: payload.clientAccountId ?? teammate.clientAccountId ?? null,
    });
    Object.assign(teammate, mapWorkspaceMembership(saved, null, currentWorkspace()));
    return teammate;
  }

  async function removeTeammate(id) {
    const teammate = teammates.value.find(item => item.id === id);
    if (!teammate) return null;
    return updateTeammate(id, { ...teammate, status: 'disabled' });
  }

  async function addRule(payload) {
    const title = payload.title?.trim();
    if (!title) throw new Error('Rule title is required.');
    const code = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString(36)}`;
    const saved = await tenantRulesApi.create({
      tenantId: Number(tenant.value.id),
      code,
      name: title,
      description: payload.description || '',
      category: payload.category || 'operations',
      enabled: payload.status !== 'disabled',
    });
    const rule = mapRule(saved);
    rules.value.unshift(rule);
    return rule;
  }

  async function updateRule(key, payload) {
    const rule = rules.value.find(item => item.key === key);
    if (!rule) return null;
    const merged = { ...rule, ...payload };
    const saved = await tenantRulesApi.update(rule.backendId, {
      tenantId: Number(tenant.value.id),
      code: rule.key,
      name: merged.title,
      description: merged.description || '',
      category: merged.category || 'operations',
      enabled: merged.status !== 'disabled',
    });
    Object.assign(rule, mapRule(saved));
    return rule;
  }

  async function removeRule(key) {
    const rule = rules.value.find(item => item.key === key);
    if (!rule) return;
    await tenantRulesApi.delete(rule.backendId);
    rules.value = rules.value.filter(item => item.key !== key);
  }

  async function addCustomField(payload) {
    const label = payload.label?.trim();
    if (!label) throw new Error('Custom field label is required.');
    const code = `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString(36)}`;
    const saved = await tenantCustomFieldsApi.create({
      tenantId: Number(tenant.value.id),
      code,
      label,
      targetResource: payload.target || 'Product',
      fieldType: payload.type || 'Text',
      required: Boolean(payload.required),
      enabled: payload.status !== 'disabled',
    });
    const field = mapCustomField(saved);
    customFields.value.unshift(field);
    return field;
  }

  async function updateCustomField(id, payload) {
    const index = customFields.value.findIndex(item => (item.id || item) === id);
    if (index < 0) return null;
    const field = customFields.value[index];
    const merged = { ...field, ...payload };
    const saved = await tenantCustomFieldsApi.update(field.backendId, {
      tenantId: Number(tenant.value.id),
      code: field.id,
      label: merged.label,
      targetResource: merged.target,
      fieldType: merged.type,
      required: Boolean(merged.required),
      enabled: merged.status !== 'disabled',
    });
    Object.assign(field, mapCustomField(saved));
    return field;
  }

  async function removeCustomField(id) {
    const field = customFields.value.find(item => item.id === id);
    if (!field) return;
    await tenantCustomFieldsApi.delete(field.backendId);
    customFields.value = customFields.value.filter(item => (item.id || item) !== id);
  }

  async function updateBilling(payload) {
    billingSaving.value = true;
    billingError.value = '';
    const tenantId = Number(billing.value.tenantId || tenant.value?.id || 0);
    const resource = {
      tenantId,
      plan: payload.plan || billing.value.plan || 'Standard',
      seats: Number(payload.seats ?? billing.value.seats ?? 0),
      warehouses: Number(payload.warehouses ?? billing.value.warehouses ?? tenant.value?.mainWarehouse?.warehouses ?? 1),
      paymentStatus: payload.paymentStatus || billing.value.paymentStatus || 'review_active',
      nextBillingDate: payload.nextBillingDate || billing.value.nextBillingDate || null,
      billingContact: payload.billingContact || billing.value.billingContact || '',
    };

    if (!tenantId) {
      billingSaving.value = false;
      billingError.value = 'tenant.companyAdmin.billing.saveError';
      throw new Error('Tenant is required before updating billing.');
    }

    try {
      const saved = billing.value.id
        ? await tenantSubscriptionsApi.update(billing.value.id, resource)
        : await tenantSubscriptionsApi.create(resource);
      billing.value = mapBilling(saved, tenant.value);
      return billing.value;
    } catch (error) {
      billingError.value = 'tenant.companyAdmin.billing.saveError';
      throw error;
    } finally {
      billingSaving.value = false;
    }
  }

  async function updatePreferences(payload) {
    await savePreferences(payload);
    return preferences.value;
  }

  return {
    tenant,
    teammates,
    rules,
    customFields,
    billing,
    billingSaving,
    billingError,
    preferences,
    checklist,
    segmentConnections,
    workspaces,
    setupProgress,
    load,
    updateCompanyProfile,
    updateWorkspace,
    createWorkspace,
    addTeammate,
    updateTeammate,
    removeTeammate,
    addRule,
    updateRule,
    removeRule,
    addCustomField,
    updateCustomField,
    removeCustomField,
    updateBilling,
    updatePreferences,
  };
});

