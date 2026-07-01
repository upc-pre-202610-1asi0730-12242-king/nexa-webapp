<script setup>
import { reactive, ref } from 'vue';

defineProps({ customFields: { type: Array, required: true } });
const emit = defineEmits(['add-custom-field', 'update-custom-field', 'remove-custom-field']);
const showForm = ref(false);
const editingId = ref('');
const form = reactive({ label: '', target: 'Product', type: 'Text', required: false, status: 'enabled' });

function fieldId(field) {
  return typeof field === 'string' ? field : field.id;
}

function fieldLabel(field, t) {
  if (typeof field === 'string') return t(`tenant.companyAdmin.customFields.${field}`);
  return field.label;
}

function fieldValue(field, key, fallback = '') {
  if (typeof field === 'string') return fallback;
  return field[key] ?? fallback;
}

function edit(field, t) {
  if (typeof field === 'string') {
    Object.assign(form, { label: t(`tenant.companyAdmin.customFields.${field}`), target: 'Product', type: 'Text', required: false, status: 'enabled' });
  } else {
    Object.assign(form, { status: 'enabled', ...field });
  }
  editingId.value = fieldId(field);
  showForm.value = false;
}

function reset() {
  Object.assign(form, { label: '', target: 'Product', type: 'Text', required: false, status: 'enabled' });
  editingId.value = '';
}

function save() {
  if (editingId.value) emit('update-custom-field', editingId.value, { ...form });
  else emit('add-custom-field', { ...form });
  reset();
  showForm.value = false;
}
</script>

<template>
  <section class="admin-section">
    <div class="section-card field-brief">
      <div>
        <h3>{{ $t('tenant.companyAdmin.customFieldsBrief.title') }}</h3>
        <p>{{ $t('tenant.companyAdmin.customFieldsBrief.desc') }}</p>
      </div>
      <div class="field-presets">
        <span>Product</span><span>Warehouse</span><span>Dispatch</span><span>Client</span>
      </div>
    </div>
    <div class="section-toolbar">
      <button type="button" class="admin-button primary" @click="reset(); showForm = true">{{ $t('tenant.companyAdmin.actions.addCustomField') }}</button>
    </div>

    <div v-if="showForm" class="table-card custom-field-table">
      <form class="admin-form admin-editor-panel custom-field-editor" @submit.prevent="save">
        <div class="editor-heading span-2">
          <strong>{{ $t('tenant.companyAdmin.actions.addCustomField') }}</strong>
          <span>{{ $t('tenant.companyAdmin.sections.customFields') }}</span>
        </div>
        <label>{{ $t('tenant.companyAdmin.form.label') }}<input v-model="form.label" required /></label>
        <label>{{ $t('tenant.companyAdmin.form.target') }}<select v-model="form.target"><option>Product</option><option>Warehouse</option><option>Purchase Request</option><option>Dispatch</option><option>Client</option></select></label>
        <label>{{ $t('tenant.companyAdmin.form.type') }}<select v-model="form.type"><option>Text</option><option>Number</option><option>Date</option><option>Select</option><option>Boolean</option></select></label>
        <label>{{ $t('tenant.companyAdmin.form.status') }}<select v-model="form.status"><option value="enabled">{{ $t('tenant.companyAdmin.status.enabled') }}</option><option value="disabled">{{ $t('tenant.companyAdmin.status.disabled') }}</option><option value="review">{{ $t('tenant.companyAdmin.status.review') }}</option></select></label>
        <div class="toggle-row span-2">
          <span>{{ $t('tenant.companyAdmin.form.required') }}</span>
          <button type="button" class="toggle-button" :class="{ on: form.required }" @click="form.required = !form.required">
            {{ form.required ? $t('common.yes') : $t('common.no') }}
          </button>
        </div>
        <div class="section-toolbar span-2">
          <button type="button" @click="showForm = false; reset()">{{ $t('common.cancel') }}</button>
          <button class="primary admin-button" type="submit">{{ $t('common.save') }}</button>
        </div>
      </form>
    </div>

    <div class="field-card-grid">
      <article v-for="field in customFields" :key="fieldId(field)" class="field-card" :class="fieldValue(field, 'status', 'enabled')">
        <div class="field-card-top">
          <div class="field-icon"><i class="pi pi-sliders-h"></i></div>
          <div>
            <strong>{{ fieldLabel(field, $t) }}</strong>
            <span>{{ fieldValue(field, 'target', 'Product') }} · {{ fieldValue(field, 'type', 'Text') }}</span>
          </div>
          <span class="status-pill" :class="fieldValue(field, 'status', 'enabled')">{{ $t(`tenant.companyAdmin.status.${fieldValue(field, 'status', 'enabled')}`) }}</span>
        </div>
        <div class="field-card-meta">
          <span>{{ $t('tenant.companyAdmin.table.required') }}: {{ fieldValue(field, 'required', false) ? $t('common.yes') : $t('common.no') }}</span>
          <span>{{ $t('tenant.companyAdmin.table.target') }}: {{ fieldValue(field, 'target', 'Product') }}</span>
          <span>{{ $t('tenant.companyAdmin.table.type') }}: {{ fieldValue(field, 'type', 'Text') }}</span>
        </div>
        <div class="row-actions">
          <button type="button" class="admin-button" @click="edit(field, $t)">{{ $t('common.edit') }}</button>
          <button type="button" class="admin-button danger" @click="emit('remove-custom-field', fieldId(field))">{{ $t('common.delete') }}</button>
        </div>
        <form v-if="editingId === fieldId(field)" class="admin-form admin-editor-panel custom-field-editor inline-field-editor" @submit.prevent="save">
          <div class="editor-heading span-2">
            <strong>{{ $t('common.edit') }} · {{ fieldLabel(field, $t) }}</strong>
            <span>{{ $t('tenant.companyAdmin.sections.customFields') }}</span>
          </div>
          <label>{{ $t('tenant.companyAdmin.form.label') }}<input v-model="form.label" required /></label>
          <label>{{ $t('tenant.companyAdmin.form.target') }}<select v-model="form.target"><option>Product</option><option>Warehouse</option><option>Purchase Request</option><option>Dispatch</option><option>Client</option></select></label>
          <label>{{ $t('tenant.companyAdmin.form.type') }}<select v-model="form.type"><option>Text</option><option>Number</option><option>Date</option><option>Select</option><option>Boolean</option></select></label>
          <label>{{ $t('tenant.companyAdmin.form.status') }}<select v-model="form.status"><option value="enabled">{{ $t('tenant.companyAdmin.status.enabled') }}</option><option value="disabled">{{ $t('tenant.companyAdmin.status.disabled') }}</option><option value="review">{{ $t('tenant.companyAdmin.status.review') }}</option></select></label>
          <div class="toggle-row span-2">
            <span>{{ $t('tenant.companyAdmin.form.required') }}</span>
            <button type="button" class="toggle-button" :class="{ on: form.required }" @click="form.required = !form.required">
              {{ form.required ? $t('common.yes') : $t('common.no') }}
            </button>
          </div>
          <div class="section-toolbar span-2">
            <button type="button" @click="reset()">{{ $t('common.cancel') }}</button>
            <button class="primary admin-button" type="submit">{{ $t('common.save') }}</button>
          </div>
        </form>
      </article>
    </div>
  </section>
</template>

<style scoped>
.row-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.custom-field-editor {
  margin-top: 14px;
}
.field-card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.field-card {
  min-height: 210px;
  display: grid;
  gap: 14px;
  align-content: start;
  border: 1px solid #dbe5f2;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff, #fbfdff);
  padding: 16px;
  box-shadow: 0 12px 28px rgba(15,23,42,.045);
}
.field-card.enabled {
  border-top: 4px solid #2563eb;
}
.field-card.review {
  border-top: 4px solid #f59e0b;
}
.field-card.disabled {
  border-top: 4px solid #94a3b8;
}
.field-card-top {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}
.field-icon {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #bfdbfe;
  border-radius: 14px;
  background: #eff6ff;
  color: #1d4ed8;
}
.field-card-top strong {
  margin: 0;
}
.field-card-top span {
  display: block;
  margin-top: 3px;
}
.field-card-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.field-card-meta span {
  min-height: 34px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  color: #334155;
  font-weight: 800;
}
.inline-field-editor {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.field-brief {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
}
.field-brief p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.55;
}
.field-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}
.field-presets span {
  padding: 8px 10px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 900;
}

@media (max-width: 900px) {
  .field-card-grid,
  .field-card-meta {
    grid-template-columns: 1fr;
  }

  .row-actions {
    justify-content: flex-start;
  }
  .field-brief {
    grid-template-columns: 1fr;
  }
  .field-presets {
    justify-content: flex-start;
  }
}
</style>
