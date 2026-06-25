import { defineStore } from 'pinia';
import { computed, reactive, ref, watch } from 'vue';
import { iamApplication } from '@/iam/application/iam.application';
import { normalizeWorkspaceSlug, isValidWorkspaceSlug } from '@/tenant-management/domain/model/value-objects/workspace-slug.value-object';
import { tenantApi } from '@/tenant-management/infrastructure/tenant-api';
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint';
import {
  createRegistrationDraft,
  createOrganizationRegistrationPayload,
  emailDomainFromCompanyWebsite,
  mapSubmittedRegistration,
  REGISTRATION_OPTIONS,
} from '@/tenant-management/infrastructure/organization-registration';

const organizationRegistrationsApi = new BaseEndpoint('/api/v1/organization-registrations');

export const useOrganizationRegistrationStore = defineStore('organizationRegistration', () => {
  const form = reactive(createRegistrationDraft());
  const currentStep = ref(0);
  const errors = reactive({});
  const submittedRegistration = ref(null);
  const submitting = ref(false);
  const slugAvailability = ref({ available: false, suggestions: [] });

  const steps = Object.freeze(['company', 'operation', 'location', 'administrator', 'workspace', 'review']);
  const workspaceUrl = computed(() => `${form.workspace.workspaceSlug || 'workspace'}.nexa.com.pe`);
  const emailWarning = computed(() =>
    form.administrator.email && iamApplication.isPersonalEmail(form.administrator.email)
      ? 'tenant.registration.validation.personalEmail'
      : ''
  );

  watch(
    () => form.workspace.workspaceSlug,
    async (workspaceSlug) => {
      const slug = normalizeWorkspaceSlug(workspaceSlug);
      try {
        slugAvailability.value = await tenantApi.checkWorkspaceSlug(slug);
      } catch {
        slugAvailability.value = { available: false, suggestions: [] };
      }
    },
    { immediate: true }
  );

  function clearErrors() {
    Object.keys(errors).forEach(key => delete errors[key]);
  }

  function addError(key, messageKey) {
    errors[key] = messageKey;
  }

  function required(value) {
    return String(value ?? '').trim().length > 0;
  }

  function update(section, field, value) {
    if (field === 'workspaceSlug') {
      form[section][field] = normalizeWorkspaceSlug(value);
      return;
    }
    form[section][field] = value;
    if (section === 'company' && field === 'companyMemberCount') {
      const count = Number(value);
      form.company.companySize = count <= 10 ? '1to10' : count <= 25 ? '11to25' : count <= 50 ? '26to50' : '51to100';
    }
    if (section === 'company' && field === 'legalName' && !form.company.tradeName) {
      form.company.tradeName = value;
    }
    if (section === 'company' && field === 'website') {
      form.workspace.emailDomain = emailDomainFromCompanyWebsite(value) || form.workspace.emailDomain;
    }
    if (section === 'workspace' && field === 'workspaceName' && !form.workspace.workspaceSlug) {
      form.workspace.workspaceSlug = normalizeWorkspaceSlug(value);
    }
    if (section === 'workspace' && field === 'plan') {
      form.workspace.capabilities = REGISTRATION_OPTIONS.planCapabilities[value] || form.workspace.capabilities;
    }
  }

  function updateCategory(category, checked) {
    const categories = form.operation.productCategories;
    if (checked && !categories.includes(category)) categories.push(category);
    if (!checked) {
      const index = categories.indexOf(category);
      if (index >= 0) categories.splice(index, 1);
    }
  }

  function updateLogo(file) {
    if (!file) {
      form.company.logoPreview = null;
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      addError('logoPreview', 'tenant.registration.validation.logoSize');
      return;
    }
    form.company.logoPreview = URL.createObjectURL(file);
  }

  function validateCompany() {
    if (!required(form.company.legalName) || form.company.legalName.trim().length < 3) addError('legalName', 'tenant.registration.validation.legalName');
    ['taxId', 'industrySector', 'companySize', 'country'].forEach(field => {
      if (!required(form.company[field])) addError(field, 'tenant.registration.validation.required');
    });
    const memberCount = Number(form.company.companyMemberCount || 0);
    if (!memberCount || memberCount < 1 || memberCount > 100) addError('companyMemberCount', 'tenant.registration.validation.companyMemberCount');
    const taxId = String(form.company.taxId || '').trim();
    if (taxId) {
      if (form.company.country === 'peru' && !/^(10|15|17|20)\d{9}$/.test(taxId)) addError('taxId', 'tenant.registration.validation.taxId');
      if (form.company.country !== 'peru' && taxId.length < 6) addError('taxId', 'tenant.registration.validation.taxIdGeneric');
    }
    if (form.company.website && !/^https?:\/\/.+\..+/.test(form.company.website)) addError('website', 'tenant.registration.validation.website');
  }

  function validateOperation() {
    if (!required(form.operation.operationType)) addError('operationType', 'tenant.registration.validation.required');
    if (!required(form.operation.monthlyVolume)) addError('monthlyVolume', 'tenant.registration.validation.required');
    if (!required(form.operation.deliveryCoverage)) addError('deliveryCoverage', 'tenant.registration.validation.required');
    if (!form.operation.productCategories.length) addError('productCategories', 'tenant.registration.validation.productCategories');
    const min = Number(form.operation.minTemperature);
    const max = Number(form.operation.maxTemperature);
    if (Number.isNaN(min) || Number.isNaN(max) || min < -30 || max > 20 || min >= max) {
      addError('temperatureRange', 'tenant.registration.validation.temperatureRange');
    }
  }

  function validateLocation() {
    ['facilityName', 'address', 'city', 'country', 'district', 'capacityEstimate'].forEach(field => {
      if (!required(form.location[field])) addError(field, 'tenant.registration.validation.required');
    });
    if (Number(form.location.warehouseCount) < 1 || Number(form.location.warehouseCount) > 10) addError('warehouseCount', 'tenant.registration.validation.warehouseCount');
    if (Number(form.location.coldRoomsCount) < 0 || Number(form.location.coldRoomsCount) > 50) addError('coldRoomsCount', 'tenant.registration.validation.coldRoomsCount');
  }

  function validateAdministrator() {
    ['firstName', 'lastName', 'email', 'jobTitle', 'phonePrefix', 'phone'].forEach(field => {
      if (!required(form.administrator[field])) addError(field, 'tenant.registration.validation.required');
    });
    if (form.administrator.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.administrator.email)) addError('email', 'tenant.registration.validation.email');
    if (iamApplication.isPersonalEmail(form.administrator.email)) addError('email', 'tenant.registration.validation.personalEmail');
    if (form.administrator.phone && !/^\+?[\d\s-]{7,18}$/.test(form.administrator.phone)) addError('phone', 'tenant.registration.validation.phone');
  }

  function validateWorkspace() {
    form.workspace.workspaceSlug = normalizeWorkspaceSlug(form.workspace.workspaceSlug);
    if (!required(form.workspace.workspaceName)) addError('workspaceName', 'tenant.registration.validation.required');
    if (!required(form.workspace.plan)) addError('plan', 'tenant.registration.validation.required');
    if (!isValidWorkspaceSlug(form.workspace.workspaceSlug)) addError('workspaceSlug', 'tenant.registration.validation.slug');
    if (!slugAvailability.value.available) addError('workspaceSlug', 'tenant.registration.validation.slugUnavailable');
  }

  function validateReview() {
    validateCompany();
    validateOperation();
    validateLocation();
    validateAdministrator();
    validateWorkspace();
    if (!form.workspace.termsAccepted) addError('termsAccepted', 'tenant.registration.validation.terms');
  }

  function validateCurrentStep() {
    clearErrors();
    if (currentStep.value === 0) validateCompany();
    if (currentStep.value === 1) validateOperation();
    if (currentStep.value === 2) validateLocation();
    if (currentStep.value === 3) validateAdministrator();
    if (currentStep.value === 4) validateWorkspace();
    if (currentStep.value === 5) validateReview();
    return Object.keys(errors).length === 0;
  }

  function nextStep() {
    if (!validateCurrentStep()) return false;
    currentStep.value = Math.min(currentStep.value + 1, steps.length - 1);
    return true;
  }

  function previousStep() {
    clearErrors();
    currentStep.value = Math.max(currentStep.value - 1, 0);
  }

  async function submit() {
    if (!validateCurrentStep()) return null;
    submitting.value = true;
    errors.submit = '';
    try {
      const payload = createOrganizationRegistrationPayload(JSON.parse(JSON.stringify(form)));
      const saved = await organizationRegistrationsApi.create(payload);
      submittedRegistration.value = mapSubmittedRegistration(saved);
      return submittedRegistration.value;
    } catch (error) {
      errors.submit = 'tenant.registration.validation.submit';
      return null;
    } finally {
      submitting.value = false;
    }
  }

  return {
    form,
    currentStep,
    steps,
    errors,
    REGISTRATION_OPTIONS,
    workspaceUrl,
    slugAvailability,
    emailWarning,
    submittedRegistration,
    submitting,
    update,
    updateCategory,
    updateLogo,
    nextStep,
    previousStep,
    submit,
  };
});
