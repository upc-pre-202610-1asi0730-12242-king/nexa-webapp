import { TENANT_CAPABILITIES } from '@/tenant-management/domain/model/value-objects/tenant-capabilities.value-object';
import { TENANT_CAPABILITY_LIST } from '@/tenant-management/infrastructure/tenant-api';

export const REGISTRATION_OPTIONS = Object.freeze({
  industrySectors: ['coldChainDistribution', 'refrigeratedStorage', 'frozenFoodDistribution', 'foodServiceSupplier', 'hospitalitySupplier', 'retailDistribution', 'seafoodMeatLogistics', 'thirdPartyColdStorage', 'mixedColdChain'],
  companySizes: ['1to10', '11to25', '26to50', '51to100'],
  countries: ['peru', 'chile', 'colombia', 'ecuador', 'bolivia', 'brazil', 'argentina', 'mexico', 'unitedStates', 'canada', 'spain', 'uruguay', 'paraguay', 'panama', 'costaRica', 'guatemala', 'dominicanRepublic'],
  operationTypes: ['b2bColdChainDistributor', 'refrigeratedWarehouseOperator', 'foodServiceSupplier', 'thirdPartyColdStorage'],
  productCategories: ['dairy', 'meat', 'frozenFoods', 'freshProduce', 'seafood', 'gourmet'],
  volumeRanges: ['lt50', '50to200', '200to500', '500to2000', 'gt2000'],
  deliveryCoverages: ['limaMetropolitana', 'callao', 'limaCallao', 'limaNorthCallao', 'limaSouthCallao', 'regionalPeru'],
  cities: ['lima', 'callao', 'arequipa', 'trujillo', 'chiclayo', 'piura'],
  districts: ['losOlivos', 'sanIsidro', 'miraflores', 'ate', 'villaElSalvador', 'lurin', 'cercadoDeLima', 'callao', 'bellavista', 'laPerla', 'ventanilla'],
  capacities: ['lt100Pallets', '100to500Pallets', '500to2000Pallets', 'gt2000Pallets'],
  phonePrefixes: ['+51', '+56', '+57', '+593', '+591', '+55', '+54', '+52', '+1'],
  languages: ['es', 'en'],
  plans: ['Starter', 'Standard', 'Professional', 'Enterprise'],
  planCapabilities: {
    Starter: [TENANT_CAPABILITIES.CATALOG_MANAGEMENT, TENANT_CAPABILITIES.SALES_REQUESTS, TENANT_CAPABILITIES.WAREHOUSE_MANAGEMENT],
    Standard: [TENANT_CAPABILITIES.CATALOG_MANAGEMENT, TENANT_CAPABILITIES.SALES_REQUESTS, TENANT_CAPABILITIES.WAREHOUSE_MANAGEMENT, TENANT_CAPABILITIES.INVENTORY_LOTS, TENANT_CAPABILITIES.LOGISTICS_DISPATCH, TENANT_CAPABILITIES.BUYER_PORTAL, TENANT_CAPABILITIES.WORKSPACE_OPERATIONS_SETUP],
    Professional: TENANT_CAPABILITY_LIST,
    Enterprise: TENANT_CAPABILITY_LIST,
  },
});

export function emailDomainFromCompanyWebsite(website = '') {
  try {
    const url = website.startsWith('http') ? new URL(website) : new URL(`https://${website}`);
    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

export function createRegistrationDraft() {
  return {
    company: {
      legalName: '',
      tradeName: '',
      taxId: '',
      industrySector: '',
      companySize: '',
      companyMemberCount: null,
      country: 'peru',
      website: '',
      logoPreview: null,
    },
    operation: {
      operationType: '',
      refrigeratedStorage: false,
      productCategories: [],
      minTemperature: null,
      maxTemperature: null,
      monthlyVolume: '',
      deliveryCoverage: '',
      requiresTraceability: false,
      requiresTemperatureAlerts: false,
    },
    location: {
      facilityName: '',
      address: '',
      district: '',
      city: '',
      country: 'peru',
      reference: '',
      warehouseCount: null,
      capacityEstimate: '',
      coldRoomsCount: null,
      fefoEnabled: false,
    },
    administrator: {
      firstName: '',
      lastName: '',
      jobTitle: '',
      email: '',
      phonePrefix: '+51',
      phone: '',
      preferredLanguage: 'es',
      roleAfterApproval: 'CompanyOwner',
    },
    workspace: {
      workspaceName: '',
      workspaceSlug: '',
      emailDomain: '',
      plan: 'Starter',
      capabilities: REGISTRATION_OPTIONS.planCapabilities.Starter,
      displayName: '',
      primaryColor: '#1d4ed8',
      termsAccepted: false,
    },
  };
}

export function createSubmittedRegistration(form) {
  return {
    id: `org-reg-${Date.now().toString(36)}`,
    status: 'pending_review',
    submittedAt: new Date().toISOString(),
    workspaceUrl: `${form.workspace.workspaceSlug}.nexa.com.pe`,
    emailDomain: form.workspace.emailDomain || emailDomainFromCompanyWebsite(form.company.website),
    companyName: form.company.legalName,
    workspaceName: form.workspace.workspaceName,
    adminEmail: form.administrator.email,
    estimatedReview: '',
  };
}

export function createOrganizationRegistrationPayload(form) {
  const submitted = createSubmittedRegistration(form);
  return {
    id: submitted.id,
    status: submitted.status,
    submittedAt: submitted.submittedAt,
    workspaceUrl: submitted.workspaceUrl,
    emailDomain: submitted.emailDomain,
    companyName: submitted.companyName,
    workspaceName: submitted.workspaceName,
    adminEmail: submitted.adminEmail,
    estimatedReview: submitted.estimatedReview,
    company: { ...form.company },
    operation: { ...form.operation },
    location: { ...form.location },
    administrator: { ...form.administrator },
    workspace: { ...form.workspace },
  };
}

export function mapSubmittedRegistration(resource = {}) {
  return {
    id: resource.externalId || resource.ExternalId || resource.id,
    status: resource.status || resource.Status || 'pending_review',
    submittedAt: resource.submittedAt || resource.SubmittedAt || new Date().toISOString(),
    workspaceUrl: resource.workspaceUrl || resource.payload?.workspaceUrl || `${resource.workspaceSlug || resource.WorkspaceSlug}.nexa.com.pe`,
    emailDomain: resource.emailDomain || resource.payload?.emailDomain || '',
    companyName: resource.companyName || resource.CompanyName || resource.payload?.companyName || '',
    workspaceName: resource.workspaceName || resource.WorkspaceName || resource.payload?.workspaceName || '',
    adminEmail: resource.adminEmail || resource.AdminEmail || resource.payload?.adminEmail || '',
    estimatedReview: resource.estimatedReview || resource.payload?.estimatedReview || '',
  };
}
