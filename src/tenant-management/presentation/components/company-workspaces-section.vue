<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { normalizeWorkspaceSlug, isValidWorkspaceSlug } from '@/tenant-management/domain/model/value-objects/workspace-slug.value-object';

const { t } = useI18n();
const props = defineProps({
  tenant: { type: Object, required: true },
  workspaces: { type: Array, default: () => [] },
  createWorkspace: { type: Function, required: true },
  updateWorkspaceAction: { type: Function, required: true },
});
const editing = ref(false);
const creating = ref(false);
const saving = ref(false);
const submitted = ref(false);
const formError = ref('');
const selectedWorkspaceId = ref(null);
const draft = reactive({
  name: '',
  slug: '',
  plan: '',
  mainWarehouse: '',
  coldRooms: 0,
  temperatureRange: '',
  fefoEnabled: false,
  temperatureAlertsEnabled: false,
  dispatchTrackingEnabled: false,
  logoPreview: '',
  backgroundPreview: '',
  workspaceImage: '',
});

const workspaceRows = computed(() => props.workspaces.length ? props.workspaces : props.tenant.workspaces || []);
const selectedWorkspace = computed(() =>
  workspaceRows.value.find(row => Number(row.id) === Number(selectedWorkspaceId.value)) ||
  workspaceRows.value.find(row => Number(row.id) === Number(props.tenant.workspaceId)) ||
  workspaceRows.value[0] ||
  props.tenant
);

watch(
  () => props.tenant,
  () => resetDraft(selectedWorkspace.value),
  { immediate: true }
);

watch(workspaceRows, () => {
  if (!selectedWorkspaceId.value && selectedWorkspace.value?.id) selectedWorkspaceId.value = selectedWorkspace.value.id;
}, { immediate: true });

function resetDraft(workspace = selectedWorkspace.value) {
    const tenant = props.tenant;
    draft.name = workspace?.name || tenant.name || '';
    draft.slug = workspace?.slug || tenant.slug || '';
    draft.plan = tenant.plan || 'Standard';
    draft.mainWarehouse = tenant.mainWarehouse?.name || '';
    draft.coldRooms = tenant.mainWarehouse?.coldRooms || 0;
    draft.temperatureRange = tenant.coldChainOperation?.temperatureRange || '';
    draft.fefoEnabled = Boolean(tenant.logisticsSetup?.fefoEnabled);
    draft.temperatureAlertsEnabled = Boolean(tenant.logisticsSetup?.temperatureAlertsEnabled);
    draft.dispatchTrackingEnabled = Boolean(tenant.logisticsSetup?.dispatchTrackingEnabled);
    draft.logoPreview = tenant.branding?.logoPreview || '';
    draft.backgroundPreview = tenant.branding?.backgroundPreview || '';
    draft.workspaceImage = tenant.branding?.workspaceImage || '';
}

const normalizedSlug = computed(() => normalizeWorkspaceSlug(draft.slug));
const workspacePreviewUrl = computed(() => `${normalizedSlug.value || 'workspace'}.nexa.com.pe`);
const slugInvalid = computed(() => !isValidWorkspaceSlug(normalizedSlug.value));
const enabledModules = computed(() => props.tenant.capabilities?.length || 0);
const readinessRows = computed(() => [
  { label: 'Plan', value: props.tenant.plan || 'Standard', tone: 'blue' },
  { label: 'Members', value: props.tenant.memberCount || 0, tone: 'cyan' },
  { label: 'Cold rooms', value: props.tenant.mainWarehouse?.coldRooms || 0, tone: 'green' },
  { label: 'Access URL', value: props.tenant.workspaceUrl || workspacePreviewUrl.value, tone: 'slate' },
]);
const visualPreviewStyle = computed(() => {
  const image = draft.backgroundPreview || props.tenant.branding?.backgroundPreview;
  return image
    ? { backgroundImage: `linear-gradient(135deg, rgba(15,23,42,.72), rgba(37,99,235,.58)), url("${image}")` }
    : {};
});

function cancel() {
  submitted.value = false;
  formError.value = '';
  resetDraft();
  editing.value = false;
  creating.value = false;
}

function startCreate() {
  formError.value = '';
  submitted.value = false;
  creating.value = true;
  editing.value = true;
  const stamp = Date.now().toString().slice(-6);
  draft.name = 'Otto Knut';
  draft.slug = normalizeWorkspaceSlug(`otto-knut-${stamp}`);
  draft.plan = props.tenant.plan || 'Standard';
  draft.mainWarehouse = props.tenant.mainWarehouse?.name || '';
  draft.coldRooms = props.tenant.mainWarehouse?.coldRooms || 0;
  draft.temperatureRange = props.tenant.coldChainOperation?.temperatureRange || '';
  draft.fefoEnabled = Boolean(props.tenant.logisticsSetup?.fefoEnabled);
  draft.temperatureAlertsEnabled = Boolean(props.tenant.logisticsSetup?.temperatureAlertsEnabled);
  draft.dispatchTrackingEnabled = Boolean(props.tenant.logisticsSetup?.dispatchTrackingEnabled);
  draft.logoPreview = '';
  draft.backgroundPreview = '';
  draft.workspaceImage = '';
}

function startEdit(workspace = selectedWorkspace.value) {
  selectedWorkspaceId.value = workspace?.id || selectedWorkspaceId.value;
  creating.value = false;
  editing.value = true;
  submitted.value = false;
  formError.value = '';
  resetDraft(workspace);
}

function friendlyError(error) {
  const message = error?.nexaMessage || error?.response?.data?.message || error?.response?.data?.detail || error?.response?.data?.title || error?.message || '';
  return /slug|conflict|duplicate|already/i.test(message)
    ? t('tenant.companyAdmin.workspace.duplicateSlug')
    : message || t('tenant.companyAdmin.workspace.saveError');
}

async function save() {
  submitted.value = true;
  formError.value = '';
  draft.slug = normalizedSlug.value;
  if (slugInvalid.value) return;
  saving.value = true;
  try {
    const saved = creating.value
      ? await props.createWorkspace({ ...draft, url: workspacePreviewUrl.value })
      : await props.updateWorkspaceAction({ ...draft, workspaceId: selectedWorkspace.value?.id });
    selectedWorkspaceId.value = saved?.id || selectedWorkspace.value?.id || selectedWorkspaceId.value;
    submitted.value = false;
    editing.value = false;
    creating.value = false;
  } catch (error) {
    formError.value = friendlyError(error);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <section class="admin-section">
    <div class="section-toolbar workspace-toolbar">
      <button type="button" class="primary admin-button" @click="startCreate">{{ $t('tenant.companyAdmin.workspace.create') }}</button>
    </div>
    <div class="workspace-list">
      <article
        v-for="workspace in workspaceRows"
        :key="workspace.id || workspace.slug"
        class="workspace-list-card"
        :class="{ active: Number(workspace.id) === Number(selectedWorkspace?.id) }"
      >
        <div>
          <span>ID {{ workspace.id }}</span>
          <strong>{{ workspace.name }}</strong>
          <small>{{ workspace.slug }} · {{ workspace.url || workspace.workspaceUrl }}</small>
        </div>
        <button type="button" class="admin-button" @click="startEdit(workspace)">Edit</button>
      </article>
    </div>
    <div class="section-card workspace-detail">
      <div class="workspace-detail-head">
        <div class="brand-preview">
          <img v-if="tenant.branding?.logoPreview" :src="tenant.branding.logoPreview" alt="" />
          <span v-else>{{ (tenant.branding?.displayName || tenant.name || 'IC').slice(0, 2).toUpperCase() }}</span>
        </div>
        <div>
          <h3>{{ tenant.name }}</h3>
          <span>{{ tenant.workspaceUrl }}</span>
        </div>
        <button v-if="!editing" type="button" class="admin-button workspace-edit-button" @click="startEdit(selectedWorkspace)">{{ $t('common.edit') }}</button>
      </div>
      <div class="detail-grid">
        <div><span>{{ $t('tenant.registration.fields.workspaceSlug') }}</span><strong>{{ tenant.slug }}</strong><small>{{ tenant.workspaceUrl }}</small></div>
        <div><span>{{ $t('tenant.workspace.mainWarehouse') }}</span><strong>{{ tenant.mainWarehouse.name }}</strong></div>
        <div><span>{{ $t('tenant.workspace.coldRooms') }}</span><strong>{{ tenant.mainWarehouse.coldRooms }}</strong></div>
        <div><span>{{ $t('tenant.workspace.temperatureRange') }}</span><strong>{{ tenant.coldChainOperation.temperatureRange }}</strong></div>
        <div><span>FEFO</span><strong>{{ tenant.logisticsSetup.fefoEnabled ? $t('common.enabled') : $t('common.disabled') }}</strong></div>
        <div><span>{{ $t('tenant.workspace.dispatchTracking') }}</span><strong>{{ tenant.logisticsSetup.dispatchTrackingEnabled ? $t('common.enabled') : $t('common.disabled') }}</strong></div>
      </div>
      <div class="workspace-readiness">
        <article v-for="row in readinessRows" :key="row.label" :class="row.tone">
          <span>{{ row.label }}</span>
          <strong>{{ row.value }}</strong>
        </article>
      </div>
      <div class="workspace-story">
        <div>
          <span>Workspace operations setup</span>
          <strong>ICISA can keep sales, inventory, dispatch, proof of delivery and buyer visibility inside one controlled tenant.</strong>
        </div>
        <div>
          <span>Activation status</span>
          <strong>Workspace membership is validated before users enter this operational workspace.</strong>
        </div>
      </div>
      <div class="workspace-visual-preview" :style="visualPreviewStyle">
        <div>
          <span>Workspace visual identity</span>
          <strong>{{ draft.name || tenant.name }}</strong>
          <small>{{ workspacePreviewUrl }}</small>
        </div>
        <img v-if="draft.workspaceImage || tenant.branding?.workspaceImage" :src="draft.workspaceImage || tenant.branding.workspaceImage" alt="" />
      </div>
      <div class="connection-list">
        <span v-for="capability in tenant.capabilities" :key="capability">{{ $t(`tenant.capabilities.${capability}`) }}</span>
      </div>

      <form v-if="editing" class="admin-form admin-editor-panel workspace-editor" @submit.prevent="save">
        <div class="editor-heading span-2">
          <strong>{{ creating ? $t('tenant.companyAdmin.workspace.create') : $t('tenant.companyAdmin.actions.manageWorkspace') }}</strong>
          <span>{{ workspacePreviewUrl }}</span>
        </div>
        <label>{{ $t('tenant.registration.fields.workspaceName') }}<input v-model="draft.name" /></label>
        <label>
          {{ $t('tenant.registration.fields.workspaceSlug') }}
          <input v-model="draft.slug" @input="draft.slug = normalizeWorkspaceSlug(draft.slug)" />
          <small v-if="submitted && slugInvalid" class="field-error">{{ $t('tenant.registration.validation.slug') }}</small>
        </label>
        <label>{{ $t('tenant.companyAdmin.billing.plan') }}<select v-model="draft.plan"><option>Starter</option><option>Standard</option><option>Professional</option><option>Enterprise</option></select></label>
        <label>{{ $t('tenant.workspace.mainWarehouse') }}<input v-model="draft.mainWarehouse" /></label>
        <label>{{ $t('tenant.workspace.coldRooms') }}<input v-model.number="draft.coldRooms" type="number" min="0" /></label>
        <label>{{ $t('tenant.workspace.temperatureRange') }}<input v-model="draft.temperatureRange" /></label>
        <label>{{ $t('tenant.companyAdmin.form.logoPreview') }}<input v-model="draft.logoPreview" :placeholder="$t('tenant.companyAdmin.workspace.logoPreviewPlaceholder')" /></label>
        <label>{{ $t('tenant.companyAdmin.workspace.backgroundImage') }}<input v-model="draft.backgroundPreview" placeholder="https://..." /></label>
        <label>{{ $t('tenant.companyAdmin.workspace.coverImage') }}<input v-model="draft.workspaceImage" placeholder="https://..." /></label>
        <div class="workspace-url-preview">
          <span>{{ $t('tenant.registration.fields.workspaceUrl') }}</span>
          <strong>{{ workspacePreviewUrl }}</strong>
        </div>
        <div class="toggle-row span-2">
          <span>FEFO</span>
          <button type="button" class="toggle-button" :class="{ on: draft.fefoEnabled }" @click="draft.fefoEnabled = !draft.fefoEnabled">
            {{ draft.fefoEnabled ? $t('common.enabled') : $t('common.disabled') }}
          </button>
        </div>
        <div class="toggle-row span-2">
          <span>{{ $t('tenant.workspace.temperatureAlerts') }}</span>
          <button type="button" class="toggle-button" :class="{ on: draft.temperatureAlertsEnabled }" @click="draft.temperatureAlertsEnabled = !draft.temperatureAlertsEnabled">
            {{ draft.temperatureAlertsEnabled ? $t('common.enabled') : $t('common.disabled') }}
          </button>
        </div>
        <div class="toggle-row span-2">
          <span>{{ $t('tenant.workspace.dispatchTracking') }}</span>
          <button type="button" class="toggle-button" :class="{ on: draft.dispatchTrackingEnabled }" @click="draft.dispatchTrackingEnabled = !draft.dispatchTrackingEnabled">
            {{ draft.dispatchTrackingEnabled ? $t('common.enabled') : $t('common.disabled') }}
          </button>
        </div>
        <div class="section-toolbar span-2">
          <p v-if="formError" class="field-error span-2">{{ formError }}</p>
          <button type="button" @click="cancel">{{ $t('common.cancel') }}</button>
          <button class="primary admin-button" type="submit" :disabled="saving">{{ saving ? $t('common.loading') : $t('common.save') }}</button>
        </div>
      </form>
      </div>
  </section>
</template>

<style scoped>
.workspace-url-preview {
  display: grid;
  gap: 5px;
  align-content: center;
  min-height: 40px;
  padding: 10px 12px;
  border: 1px solid #bfdbfe;
  border-radius: 14px;
  background: linear-gradient(180deg, #eff6ff, #ffffff);
}

.workspace-detail {
  background:
    radial-gradient(circle at 100% 0%, rgba(37,99,235,.08), transparent 30%),
    linear-gradient(180deg, #ffffff, #fbfdff);
  overflow: hidden;
}

.detail-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.workspace-detail-head {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 14px;
}

.workspace-detail-head > div:nth-child(2) {
  min-width: 0;
  flex: 1;
}

.workspace-edit-button {
  margin-left: auto;
}

.workspace-editor {
  margin-top: 16px;
}
.workspace-toolbar {
  justify-content: flex-end;
}
.workspace-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}
.workspace-list-card {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid #dbe5f2;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff, #fbfdff);
}
.workspace-list-card.active {
  border-color: #93c5fd;
  box-shadow: inset 0 0 0 1px rgba(147,197,253,.55);
}

.workspace-readiness {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 14px 0;
}

.workspace-readiness article {
  min-height: 88px;
  display: grid;
  align-content: center;
  gap: 8px;
  padding: 14px;
  border: 1px solid #dbe5f2;
  border-radius: 18px;
  background: #fff;
}

.workspace-readiness article.blue { background: linear-gradient(135deg, #eff6ff, #fff); border-color: #bfdbfe; }
.workspace-readiness article.cyan { background: linear-gradient(135deg, #ecfeff, #fff); border-color: #a5f3fc; }
.workspace-readiness article.green { background: linear-gradient(135deg, #f0fdf4, #fff); border-color: #bbf7d0; }
.workspace-readiness article.slate { background: linear-gradient(135deg, #f8fafc, #fff); border-color: #cbd5e1; }

.workspace-readiness span,
.workspace-story span {
  color: #64748b;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.workspace-readiness strong {
  color: #0f172a;
  font-size: 18px;
  line-height: 1.2;
  word-break: break-word;
}

.workspace-story {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.workspace-visual-preview {
  min-height: 178px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(180px, 320px);
  gap: 18px;
  align-items: center;
  margin: 0 0 14px;
  padding: 18px;
  border: 1px solid #bfdbfe;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(37,99,235,.92), rgba(14,165,233,.66)),
    linear-gradient(135deg, #1d4ed8, #0891b2);
  background-size: cover;
  background-position: center;
  overflow: hidden;
}

.workspace-visual-preview span,
.workspace-visual-preview small {
  display: block;
  color: rgba(255,255,255,.78);
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.workspace-visual-preview strong {
  margin: 7px 0 5px;
  color: #fff;
  font-size: clamp(22px, 2.2vw, 34px);
  line-height: 1.1;
}

.workspace-visual-preview img {
  width: 100%;
  height: 138px;
  object-fit: cover;
  border: 1px solid rgba(255,255,255,.42);
  border-radius: 14px;
  background: rgba(255,255,255,.12);
}

.workspace-story > div {
  display: grid;
  gap: 7px;
  padding: 14px;
  border: 1px solid #dbe5f2;
  border-radius: 18px;
  background: rgba(248, 251, 255, .86);
}

.workspace-story strong {
  color: #1e293b;
  line-height: 1.45;
}

.brand-preview {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 900;
  overflow: hidden;
}

.brand-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 980px) {
  .detail-grid,
  .workspace-readiness,
  .workspace-story {
    grid-template-columns: 1fr;
  }
  .workspace-visual-preview {
    grid-template-columns: 1fr;
  }
}
</style>
