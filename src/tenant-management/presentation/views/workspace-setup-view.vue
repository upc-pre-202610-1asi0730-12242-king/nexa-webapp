<script setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/iam/application/iam.store';
import { useWorkspaceSetupStore } from '@/tenant-management/application/workspace-setup.store';
import TenantBrandingCard from '@/tenant-management/presentation/components/tenant-branding-card.vue';
import TenantCapabilitiesPanel from '@/tenant-management/presentation/components/tenant-capabilities-panel.vue';
import WorkspaceOnboardingChecklist from '@/tenant-management/presentation/components/workspace-onboarding-checklist.vue';
import LogisticsWorkspaceControlPanel from '@/tenant-management/presentation/components/logistics-workspace-control-panel.vue';

const auth = useAuthStore();
const store = useWorkspaceSetupStore();
const { tenantProfile, checklist, segmentConnections, completionPercent } = storeToRefs(store);

onMounted(() => {
  store.loadWorkspaceSetup(auth.tenant?.slug || 'icisa');
});
</script>

<template>
  <section v-if="tenantProfile" class="workspace-setup-page">
    <header class="workspace-setup-header">
      <div>
        <span>{{ $t('tenant.workspace.eyebrow') }}</span>
        <h1>{{ $t('tenant.workspace.title') }}</h1>
        <p>{{ $t('tenant.workspace.subtitle') }}</p>
      </div>
      <div class="status-pill">{{ $t(`auth.tenantStatus.${tenantProfile.status}`) }}</div>
    </header>

    <div class="workspace-grid">
      <TenantBrandingCard :tenant="tenantProfile" />
      <LogisticsWorkspaceControlPanel :tenant="tenantProfile" />
      <WorkspaceOnboardingChecklist :checklist="checklist" :completion-percent="completionPercent" />
      <TenantCapabilitiesPanel :capabilities="tenantProfile.capabilities" />
    </div>

    <section class="tm-card segment-section">
      <h3>{{ $t('tenant.workspace.segmentConnections') }}</h3>
      <div class="segment-grid">
        <article v-for="segment in segmentConnections" :key="segment.key">
          <i :class="'pi ' + segment.icon" aria-hidden="true"></i>
          <strong>{{ $t(`tenant.workspace.segments.${segment.key}.title`) }}</strong>
          <p>{{ $t(`tenant.workspace.segments.${segment.key}.desc`) }}</p>
        </article>
      </div>
    </section>
  </section>
</template>

<style scoped>
.workspace-setup-page { display:grid; gap:22px; }
.workspace-setup-header { display:flex; justify-content:space-between; gap:18px; align-items:flex-start; padding:26px; border-radius:20px; background:linear-gradient(135deg,#0f3f91,#155cbb); color:white; }
.workspace-setup-header span { font-size:12px; font-weight:800; text-transform:uppercase; opacity:.78; }
.workspace-setup-header h1 { margin:8px 0; font-size:30px; line-height:1.12; }
.workspace-setup-header p { margin:0; max-width:680px; color:rgba(255,255,255,.78); line-height:1.6; }
.status-pill { padding:8px 12px; border:1px solid rgba(255,255,255,.22); border-radius:999px; background:rgba(255,255,255,.10); font-size:12px; font-weight:800; }
.workspace-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
:deep(.tm-card), .tm-card { border:1px solid #e2e8f0; border-radius:18px; background:#fff; padding:18px; box-shadow:0 12px 26px rgba(15,23,42,.05); }
:deep(.branding-card) { display:flex; align-items:center; gap:14px; }
:deep(.brand-mark) { width:54px; height:54px; display:flex; align-items:center; justify-content:center; border-radius:16px; background:#1d4ed8; color:white; font-weight:800; }
:deep(.tm-card h2), :deep(.tm-card h3), .tm-card h3 { margin:0 0 12px; color:#0f172a; }
:deep(.tm-card span) { color:#64748b; font-size:12px; }
:deep(.tm-card p) { margin:4px 0 0; color:#475569; font-size:13px; }
:deep(.setup-grid) { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
:deep(.setup-grid div), :deep(.review-summary div) { padding:11px; border-radius:12px; background:#f8fafc; border:1px solid #e2e8f0; }
:deep(.setup-grid strong) { display:block; color:#0f172a; font-size:13px; margin-top:4px; }
:deep(.cap-list) { display:flex; flex-wrap:wrap; gap:8px; }
:deep(.cap-list span) { padding:6px 10px; border-radius:999px; background:#eff6ff; color:#1d4ed8; font-weight:700; }
:deep(.section-head) { display:flex; justify-content:space-between; align-items:center; }
:deep(.checklist) { list-style:none; padding:0; margin:0; display:grid; gap:9px; }
:deep(.checklist li) { display:flex; gap:8px; align-items:center; color:#475569; font-size:13px; }
:deep(.checklist li.done) { color:#166534; font-weight:700; }
.segment-grid { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:12px; }
.segment-grid article { padding:14px; border:1px solid #e2e8f0; border-radius:14px; background:#f8fafc; }
.segment-grid i { color:#1d4ed8; margin-bottom:10px; }
.segment-grid strong { display:block; color:#0f172a; font-size:13px; margin-bottom:5px; }
.segment-grid p { margin:0; color:#64748b; font-size:12px; line-height:1.45; }
@media (max-width: 1100px) { .segment-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media (max-width: 760px) { .workspace-setup-header, .workspace-grid { grid-template-columns:1fr; } .workspace-grid { display:grid; } .segment-grid { grid-template-columns:1fr; } }
</style>

