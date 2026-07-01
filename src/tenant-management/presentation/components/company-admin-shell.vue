<script setup>
import CompanyOverviewSection from './company-overview-section.vue';
import CompanyWorkspacesSection from './company-workspaces-section.vue';
import CompanyTeammatesSection from './company-teammates-section.vue';
import CompanyRulesSection from './company-rules-section.vue';
import CompanyCustomFieldsSection from './company-custom-fields-section.vue';
import CompanyBillingSection from './company-billing-section.vue';
import CompanyPreferencesSection from './company-preferences-section.vue';

defineProps({
  activeSection: { type: String, required: true },
  activeAction: { type: String, default: '' },
  tenant: { type: Object, required: true },
  setupProgress: { type: Number, required: true },
  segmentConnections: { type: Array, required: true },
  teammates: { type: Array, required: true },
  rules: { type: Array, required: true },
  customFields: { type: Array, required: true },
  billing: { type: Object, required: true },
  billingUsage: { type: Object, required: true },
  billingSaving: { type: Boolean, default: false },
  billingError: { type: String, default: '' },
  saveBilling: { type: Function, required: true },
  preferences: { type: Object, required: true },
  workspaces: { type: Array, default: () => [] },
  createWorkspace: { type: Function, required: true },
  updateWorkspaceAction: { type: Function, required: true },
});

const emit = defineEmits([
  'select',
  'update-company',
  'update-workspace',
  'add-teammate',
  'update-teammate',
  'remove-teammate',
  'add-rule',
  'update-rule',
  'remove-rule',
  'add-custom-field',
  'update-custom-field',
  'remove-custom-field',
  'update-preferences',
]);
</script>

<template>
  <div class="company-admin-shell">
    <main class="company-admin-content">
      <CompanyOverviewSection
        v-if="activeSection === 'overview'"
        :tenant="tenant"
        :setup-progress="setupProgress"
        :segment-connections="segmentConnections"
        @select="(section, action) => emit('select', section, action)"
        @update-company="payload => emit('update-company', payload)"
      />
      <CompanyWorkspacesSection
        v-else-if="activeSection === 'workspaces'"
        :tenant="tenant"
        :workspaces="workspaces"
        :create-workspace="createWorkspace"
        :update-workspace-action="updateWorkspaceAction"
      />
      <CompanyTeammatesSection
        v-else-if="activeSection === 'teammates'"
        :teammates="teammates"
        :auto-open="activeAction === 'invite'"
        @add-teammate="payload => emit('add-teammate', payload)"
        @update-teammate="(id, payload) => emit('update-teammate', id, payload)"
        @remove-teammate="id => emit('remove-teammate', id)"
      />
      <CompanyRulesSection
        v-else-if="activeSection === 'rules'"
        :rules="rules"
        @add-rule="payload => emit('add-rule', payload)"
        @update-rule="(key, payload) => emit('update-rule', key, payload)"
        @remove-rule="key => emit('remove-rule', key)"
      />
      <CompanyCustomFieldsSection
        v-else-if="activeSection === 'customFields'"
        :custom-fields="customFields"
        @add-custom-field="payload => emit('add-custom-field', payload)"
        @update-custom-field="(id, payload) => emit('update-custom-field', id, payload)"
        @remove-custom-field="id => emit('remove-custom-field', id)"
      />
      <CompanyBillingSection
        v-else-if="activeSection === 'billing'"
        :billing="billing"
        :usage="billingUsage"
        :saving="billingSaving"
        :error="billingError"
        :save-billing="saveBilling"
      />
      <CompanyPreferencesSection
        v-else
        :preferences="preferences"
        @update-preferences="payload => emit('update-preferences', payload)"
      />
    </main>
  </div>
</template>

<style scoped>
.company-admin-shell { display:block; }
.company-admin-content { min-width:0; }
:deep(.admin-section) { display:grid; gap:18px; }
:deep(.admin-panel), :deep(.section-card), :deep(.table-card), :deep(.admin-form) { border:1px solid #dbe5f2; border-radius:18px; background:linear-gradient(180deg,#ffffff 0%,#fbfdff 100%); box-shadow:0 12px 28px rgba(15,23,42,.045); }
:deep(.metric-grid), :deep(.detail-grid), :deep(.rule-grid), :deep(.field-list) { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
:deep(.metric-grid article), :deep(.section-card), :deep(.detail-grid div), :deep(.rule-grid article), :deep(.field-list article), :deep(.table-card), :deep(.admin-form) { border:1px solid #dbe5f2; border-radius:18px; background:linear-gradient(180deg,#ffffff 0%,#fbfdff 100%); padding:18px; box-shadow:0 12px 28px rgba(15,23,42,.045); }
:deep(span), :deep(small), :deep(em), :deep(.admin-note) { color:#64748b; font-size:12px; font-style:normal; }
:deep(strong) { display:block; color:#0f172a; font-size:14px; margin-top:4px; overflow-wrap:anywhere; }
:deep(h3) { margin:0 0 12px; color:#0f172a; font-size:16px; line-height:1.25; letter-spacing:0; }
:deep(.connection-list) { display:flex; flex-wrap:wrap; gap:8px; }
:deep(.connection-list span) { padding:6px 10px; border-radius:999px; background:#eff6ff; color:#1d4ed8; font-weight:700; }
:deep(.section-toolbar) { display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap; }
:deep(.section-toolbar button), :deep(.admin-button) { min-height:38px; padding:0 14px; border:1px solid #cbd8ea; border-radius:11px; background:linear-gradient(180deg,#ffffff,#f8fbff); color:#334155; font-size:13px; font-weight:800; cursor:pointer; box-shadow:0 1px 0 rgba(255,255,255,.9), 0 8px 18px rgba(15,23,42,.035); }
:deep(.section-toolbar button:hover), :deep(.admin-button:hover) { background:#eff6ff; border-color:#bfdbfe; color:#1d4ed8; }
:deep(.section-toolbar button:disabled), :deep(.admin-button:disabled) { opacity:.45; cursor:not-allowed; }
:deep(.admin-button.primary) { background:linear-gradient(135deg,#2563eb,#1d4ed8); border-color:#1d4ed8; color:white; box-shadow:0 12px 24px rgba(37,99,235,.18); }
:deep(.admin-button.danger) { background:#fff1f2; border-color:#fecdd3; color:#be123c; }
:deep(.admin-button.ghost) { background:white; }
:deep(.admin-form) { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
:deep(.admin-editor-panel) { border-color:#93c5fd; background:linear-gradient(180deg,#f8fbff,#eff6ff); box-shadow:inset 0 0 0 1px rgba(191,219,254,.72); }
:deep(.editor-heading) { display:flex; align-items:flex-end; justify-content:space-between; gap:12px; padding-bottom:4px; border-bottom:1px solid #dbeafe; }
:deep(.editor-heading strong) { margin:0; font-size:14px; }
:deep(.editor-heading span) { font-size:12px; color:#64748b; }
:deep(.admin-form label) { display:grid; gap:6px; color:#334155; font-size:12px; font-weight:700; }
:deep(.admin-form input), :deep(.admin-form select), :deep(.admin-form textarea) { width:100%; min-height:44px; border:1px solid #cbd8ea; border-radius:13px; padding:0 13px; color:#0f172a; background:linear-gradient(180deg,#ffffff,#f8fbff); box-sizing:border-box; box-shadow:inset 0 1px 0 rgba(255,255,255,.9); }
:deep(.admin-form input:focus), :deep(.admin-form select:focus), :deep(.admin-form textarea:focus) { outline:0; border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.12); }
:deep(.admin-form textarea) { padding:10px 11px; resize:vertical; }
:deep(.admin-form .span-2) { grid-column:1/-1; }
:deep(.table-row) { display:grid; gap:12px; align-items:center; padding:14px 16px; border-bottom:1px solid #e2e8f0; }
:deep(.table-row:last-child) { border-bottom:0; }
:deep(.rule-grid i) { color:#16a34a; margin-right:8px; }
:deep(.status-pill) { display:inline-flex; align-items:center; gap:6px; width:max-content; min-height:24px; padding:0 9px; border-radius:999px; font-size:11px; font-weight:900; text-transform:capitalize; border:1px solid #e2e8f0; background:#f8fafc; color:#64748b; }
:deep(.status-pill.enabled), :deep(.status-pill.active) { background:#f0fdf4; color:#15803d; border-color:#bbf7d0; }
:deep(.status-pill.disabled) { background:#f8fafc; color:#64748b; border-color:#e2e8f0; }
:deep(.status-pill.review), :deep(.status-pill.invited) { background:#fffbeb; color:#b45309; border-color:#fde68a; }
:deep(.admin-setting-row) { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:14px; align-items:center; padding:14px 0; border-bottom:1px solid #f1f5f9; }
:deep(.admin-setting-row:last-child) { border-bottom:0; }
:deep(.admin-setting-copy strong) { margin:0; }
:deep(.admin-setting-copy span) { display:block; margin-top:3px; line-height:1.4; }
:deep(.admin-inline-control) { width:min(100%,260px); min-height:38px; border:1px solid #cbd8ea; border-radius:11px; background:linear-gradient(180deg,#ffffff,#f8fbff); color:#0f172a; padding:0 12px; box-sizing:border-box; font-size:13px; box-shadow:inset 0 1px 0 rgba(255,255,255,.9); }
:deep(.admin-inline-control:focus) { outline:0; border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.12); }
:deep(.inline-actions) { padding-top:14px; border-top:1px solid #f1f5f9; }
:deep(.toggle-button) { min-width:78px; min-height:30px; border:1px solid #cbd5e1; border-radius:999px; background:#f8fafc; color:#475569; font-size:12px; font-weight:900; cursor:pointer; }
:deep(.toggle-button.on) { background:#dcfce7; border-color:#bbf7d0; color:#15803d; }
@media (max-width:900px){ :deep(.metric-grid), :deep(.detail-grid), :deep(.rule-grid), :deep(.field-list), :deep(.admin-form) { grid-template-columns:1fr; } :deep(.table-row), :deep(.admin-setting-row) { grid-template-columns:1fr; } :deep(.admin-form .span-2) { grid-column:auto; } }
</style>

