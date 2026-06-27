<script setup>
import { reactive, ref, watch } from 'vue';

const props = defineProps({
  tenant: { type: Object, required: true },
  setupProgress: { type: Number, required: true },
  segmentConnections: { type: Array, required: true },
});

const emit = defineEmits(['select', 'update-company']);
const editing = ref(false);
const draft = reactive({ name: '', displayName: '', country: '', logoPreview: '' });

watch(
  () => props.tenant,
  resetDraft,
  { immediate: true }
);

function resetDraft(tenant = props.tenant) {
    draft.name = tenant.name || '';
    draft.displayName = tenant.branding?.displayName || tenant.name || '';
    draft.country = tenant.mainWarehouse?.country || 'Peru';
    draft.logoPreview = tenant.branding?.logoPreview || '';
}

function save() {
  emit('update-company', { ...draft });
  editing.value = false;
}

function cancel() {
  resetDraft();
  editing.value = false;
}
</script>

<template>
  <section class="admin-section">
    <div class="overview-hero section-card">
      <div class="overview-brand">
        <div class="overview-logo">
          <img v-if="tenant.branding?.logoPreview" :src="tenant.branding.logoPreview" alt="" />
          <span v-else>{{ (tenant.branding?.displayName || tenant.name || 'IC').slice(0, 2).toUpperCase() }}</span>
        </div>
        <div>
          <span>{{ $t('tenant.companyAdmin.overview.tenant') }}</span>
          <h3>{{ tenant.name }}</h3>
          <p>{{ tenant.workspaceUrl }}</p>
        </div>
      </div>
      <div class="overview-actions">
        <button type="button" class="admin-button primary" @click="editing = true">{{ $t('tenant.companyAdmin.actions.editProfile') }}</button>
        <button type="button" class="admin-button" @click="emit('select', 'workspaces')">{{ $t('tenant.companyAdmin.actions.manageWorkspace') }}</button>
        <button type="button" class="admin-button" @click="emit('select', 'teammates', 'invite')">{{ $t('tenant.companyAdmin.actions.registerTeammate') }}</button>
        <button type="button" class="admin-button ghost" @click="emit('select', 'teammates')">{{ $t('tenant.companyAdmin.actions.reviewAccess') }}</button>
      </div>

      <form v-if="editing" class="admin-form admin-editor-panel overview-editor" @submit.prevent="save">
        <div class="editor-heading span-2">
          <strong>{{ $t('tenant.companyAdmin.actions.editProfile') }}</strong>
          <span>{{ tenant.workspaceUrl }}</span>
        </div>
        <label>{{ $t('tenant.companyAdmin.form.legalName') }}<input v-model="draft.name" /></label>
        <label>{{ $t('tenant.companyAdmin.form.displayName') }}<input v-model="draft.displayName" /></label>
        <label>{{ $t('tenant.companyAdmin.form.country') }}<input v-model="draft.country" /></label>
        <label>{{ $t('tenant.companyAdmin.form.logoPreview') }}<input v-model="draft.logoPreview" placeholder="https://..." /></label>
        <div class="section-toolbar span-2">
          <button type="button" @click="cancel">{{ $t('common.cancel') }}</button>
          <button class="primary admin-button" type="submit">{{ $t('common.save') }}</button>
        </div>
      </form>
    </div>

    <div class="metric-grid">
      <article>
        <span>{{ $t('tenant.companyAdmin.overview.status') }}</span>
        <strong>{{ $t(`auth.tenantStatus.${tenant.status}`) }}</strong>
        <small>{{ tenant.plan }}</small>
      </article>
      <article>
        <span>{{ $t('tenant.companyAdmin.overview.progress') }}</span>
        <strong>{{ setupProgress }}%</strong>
        <div class="setup-progress"><span :style="{ width: `${setupProgress}%` }"></span></div>
      </article>
      <article>
        <span>{{ $t('tenant.companyAdmin.overview.temperature') }}</span>
        <strong>{{ tenant.coldChainOperation.temperatureRange }}</strong>
        <small>{{ tenant.logisticsSetup.inventoryLotPolicy }} · {{ tenant.logisticsSetup.fefoEnabled ? $t('common.enabled') : $t('common.disabled') }}</small>
      </article>
      <article>
        <span>{{ $t('tenant.workspace.mainWarehouse') }}</span>
        <strong>{{ tenant.mainWarehouse.name }}</strong>
        <small>{{ tenant.mainWarehouse.coldRooms }} {{ $t('tenant.workspace.coldRooms') }}</small>
      </article>
    </div>

    <div class="section-card">
      <h3>{{ $t('tenant.workspace.segmentConnections') }}</h3>
      <div class="connection-list">
        <span v-for="connection in segmentConnections" :key="connection.key">
          <i :class="'pi ' + connection.icon" aria-hidden="true"></i>
          {{ $t(`tenant.workspace.segments.${connection.key}.title`) }}
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.overview-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
}

.overview-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.overview-logo {
  width: 58px;
  height: 58px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  font-weight: 900;
  overflow: hidden;
  flex-shrink: 0;
}

.overview-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overview-brand h3 {
  margin: 3px 0;
}

.overview-brand p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

.overview-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.overview-editor {
  grid-column: 1 / -1;
}

.setup-progress {
  height: 7px;
  margin-top: 10px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}

.setup-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #2563eb;
}

@media (max-width: 760px) {
  .overview-hero {
    grid-template-columns: 1fr;
  }

  .overview-actions {
    justify-content: flex-start;
  }
}
</style>
