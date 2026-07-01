<script setup>
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/iam/application/iam.store';
import { useDataStore } from '@/app/application/stores/data.store';
import { useCompanyAdministrationStore } from '@/tenant-management/application/company-administration.store';
import CompanyAdminShell from '@/tenant-management/presentation/components/company-admin-shell.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const store = useCompanyAdministrationStore();
const dataStore = useDataStore();
const {
  tenant,
  teammates,
  rules,
  customFields,
  billing,
  billingSaving,
  billingError,
  preferences,
  segmentConnections,
  setupProgress,
} = storeToRefs(store);

const sections = [
  { key: 'overview', query: 'overview' },
  { key: 'workspaces', query: 'workspaces' },
  { key: 'teammates', query: 'teammates' },
  { key: 'rules', query: 'rules' },
  { key: 'customFields', query: 'custom-fields' },
  { key: 'billing', query: 'billing' },
  { key: 'preferences', query: 'preferences' },
];

const activeSection = computed(() => {
  const rawSection = String(route.query.section || 'overview');
  const section = rawSection === 'custom-fields' ? 'customFields' : rawSection;
  return sections.some(item => item.key === section) ? section : 'overview';
});

const activeAction = computed(() => String(route.query.action || ''));
const sectionTitleKey = computed(() => `tenant.companyAdmin.sections.${activeSection.value}`);
const sectionSubtitleKey = computed(() => `tenant.companyAdmin.sectionSubtitles.${activeSection.value}`);
const billingUsage = computed(() => ({
  users: teammates.value.length,
  warehouses: dataStore.D.warehouses.length,
  monthlyRequests: dataStore.D.purchaseRequests.length,
  dispatches: dataStore.D.dispatchOrders.length,
  documents: dataStore.D.businessDocuments.length,
}));

function selectSection(section, action = '') {
  const routeSection = sections.find(item => item.key === section)?.query || section;
  const query = { ...route.query, section: routeSection };
  if (action) query.action = action;
  else delete query.action;
  router.replace({ path: route.path, query });
}

onMounted(() => {
  store.load(auth.tenant?.slug || 'icisa');
});
</script>

<template>
  <section v-if="tenant" class="company-admin-page">
    <header class="company-admin-header">
      <div>
        <span>{{ $t('tenant.companyAdmin.eyebrow') }}</span>
        <h1>{{ activeSection === 'overview' ? $t('tenant.companyAdmin.title') : $t(sectionTitleKey) }}</h1>
        <p>{{ $t(sectionSubtitleKey) }}</p>
      </div>
      <div class="workspace-pill">{{ tenant.workspaceUrl }}</div>
    </header>

    <CompanyAdminShell
      :active-section="activeSection"
      :active-action="activeAction"
      :tenant="tenant"
      :setup-progress="setupProgress"
      :segment-connections="segmentConnections"
      :teammates="teammates"
      :rules="rules"
      :custom-fields="customFields"
      :billing="billing"
      :billing-usage="billingUsage"
      :billing-saving="billingSaving"
      :billing-error="billingError"
      :preferences="preferences"
      :save-billing="store.updateBilling"
      @select="selectSection"
      @update-company="store.updateCompanyProfile"
      @update-workspace="store.updateWorkspace"
      @add-teammate="store.addTeammate"
      @update-teammate="store.updateTeammate"
      @remove-teammate="store.removeTeammate"
      @add-rule="store.addRule"
      @update-rule="store.updateRule"
      @remove-rule="store.removeRule"
      @add-custom-field="store.addCustomField"
      @update-custom-field="store.updateCustomField"
      @remove-custom-field="store.removeCustomField"
      @update-preferences="store.updatePreferences"
    />
  </section>
</template>

<style scoped>
.company-admin-page { width:min(100%,1680px); display:grid; gap:20px; margin:0 auto; }
.company-admin-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding:4px 0 16px; border-bottom:1px solid #e2e8f0; }
.company-admin-header span { color:#2563eb; font-size:12px; font-weight:800; text-transform:uppercase; }
.company-admin-header h1 { margin:6px 0 6px; color:#0f172a; font-size:28px; line-height:1.15; letter-spacing:0; }
.company-admin-header p { margin:0; color:#64748b; font-size:14px; line-height:1.55; max-width:720px; }
.workspace-pill { padding:8px 12px; border:1px solid #bfdbfe; border-radius:999px; background:#eff6ff; color:#1d4ed8; font-size:12px; font-weight:800; white-space:nowrap; }
@media (max-width:760px){ .company-admin-header { flex-direction:column; } .workspace-pill { white-space:normal; } }
</style>
