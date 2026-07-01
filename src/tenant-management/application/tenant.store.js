import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { tenantApi } from '@/tenant-management/infrastructure/tenant-api';

export const useTenantStore = defineStore('tenantManagement', () => {
  const currentTenant = ref(null);
  const loading = ref(false);

  const tenantStatus = computed(() => currentTenant.value?.status || '');
  const tenantCapabilities = computed(() => currentTenant.value?.capabilities || []);
  const tenantBranding = computed(() => currentTenant.value?.branding || {});

  async function loadCurrentTenant(slug = 'icisa') {
    loading.value = true;
    try {
      currentTenant.value = await tenantApi.getCurrentTenant(slug);
      return currentTenant.value;
    } finally {
      loading.value = false;
    }
  }

  return {
    currentTenant,
    tenantStatus,
    tenantCapabilities,
    tenantBranding,
    loading,
    loadCurrentTenant,
  };
});
