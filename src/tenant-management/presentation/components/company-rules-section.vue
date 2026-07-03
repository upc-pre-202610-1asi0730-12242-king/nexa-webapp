<script setup>
import { reactive, ref } from 'vue';

defineProps({ rules: { type: Array, required: true } });
const emit = defineEmits(['add-rule', 'update-rule', 'remove-rule']);
const showForm = ref(false);
const editingKey = ref('');
const form = reactive({
  title: '',
  description: '',
  category: 'Logistics',
  status: 'enabled',
});

function label(rule, t) {
  return rule.title || t(`tenant.companyAdmin.rules.${rule.key}`);
}

function edit(rule, t) {
  Object.assign(form, {
    title: label(rule, t),
    description: rule.description || '',
    category: rule.category || 'Tenant',
    status: rule.status || (rule.enabled === false ? 'disabled' : 'enabled'),
  });
  editingKey.value = rule.key;
  showForm.value = false;
}

function reset() {
  Object.assign(form, { title: '', description: '', category: 'Logistics', status: 'enabled' });
  editingKey.value = '';
}

function save() {
  if (editingKey.value) emit('update-rule', editingKey.value, { ...form });
  else emit('add-rule', { ...form });
  reset();
  showForm.value = false;
}
</script>

<template>
  <section class="admin-section">
    <div class="section-card rules-brief">
      <div>
        <h3>{{ $t('tenant.companyAdmin.rulesBrief.title') }}</h3>
        <p>{{ $t('tenant.companyAdmin.rulesBrief.desc') }}</p>
      </div>
      <div class="rules-kpis">
        <span>{{ rules.filter(rule => (rule.status || 'enabled') === 'enabled').length }} {{ $t('common.enabled') }}</span>
        <span>{{ rules.filter(rule => (rule.status || 'enabled') === 'disabled').length }} {{ $t('common.disabled') }}</span>
      </div>
    </div>
    <div class="section-toolbar">
      <button type="button" class="admin-button primary" @click="reset(); showForm = true">{{ $t('tenant.companyAdmin.actions.addRule') }}</button>
    </div>

    <div class="rule-grid">
      <article v-for="rule in rules" :key="rule.key" class="rule-card" :class="rule.status || (rule.enabled === false ? 'disabled' : 'enabled')">
        <div class="rule-card-head">
          <span class="status-pill" :class="rule.status || (rule.enabled === false ? 'disabled' : 'enabled')">
            {{ $t(`tenant.companyAdmin.status.${rule.status || (rule.enabled === false ? 'disabled' : 'enabled')}`) }}
          </span>
          <span>{{ rule.category || 'Tenant' }}</span>
        </div>
        <strong>{{ label(rule, $t) }}</strong>
        <small>{{ rule.description || $t('tenant.companyAdmin.rules.noDescription') }}</small>
        <div class="rule-meta">
          <span>Inventory</span>
          <span>Dispatch</span>
          <span>Portal</span>
        </div>
        <div class="rule-actions">
          <button type="button" class="admin-button" @click="edit(rule, $t)">{{ $t('common.edit') }}</button>
          <button type="button" class="admin-button" @click="emit('update-rule', rule.key, { status: 'enabled' })">{{ $t('common.enabled') }}</button>
          <button type="button" class="admin-button danger" :disabled="rule.status === 'disabled'" @click="emit('update-rule', rule.key, { status: 'disabled' })">{{ $t('tenant.companyAdmin.actions.deactivate') }}</button>
        </div>
        <form v-if="editingKey === rule.key" class="admin-form admin-editor-panel inline-rule-editor" @submit.prevent="save">
          <div class="editor-heading span-2">
            <strong>{{ $t('common.edit') }} · {{ label(rule, $t) }}</strong>
            <span>{{ rule.category || 'Tenant' }}</span>
          </div>
          <label>{{ $t('tenant.companyAdmin.form.ruleTitle') }}<input v-model="form.title" required /></label>
          <label>{{ $t('tenant.companyAdmin.form.category') }}<select v-model="form.category"><option>Warehouse</option><option>Logistics</option><option>Dispatch</option><option>Commercial</option><option>Buyer Portal</option></select></label>
          <label>{{ $t('tenant.companyAdmin.form.status') }}<select v-model="form.status"><option value="enabled">{{ $t('tenant.companyAdmin.status.enabled') }}</option><option value="disabled">{{ $t('tenant.companyAdmin.status.disabled') }}</option></select></label>
          <label class="span-2">{{ $t('tenant.companyAdmin.form.description') }}<textarea v-model="form.description" rows="3"></textarea></label>
          <div class="section-toolbar span-2">
            <button type="button" @click="reset()">{{ $t('common.cancel') }}</button>
            <button class="primary admin-button" type="submit">{{ $t('common.save') }}</button>
          </div>
        </form>
      </article>
    </div>

    <form v-if="showForm" class="admin-form admin-editor-panel" @submit.prevent="save">
      <div class="editor-heading span-2">
        <strong>{{ editingKey ? $t('common.edit') : $t('tenant.companyAdmin.actions.addRule') }}</strong>
        <span>{{ $t('tenant.companyAdmin.sections.rules') }}</span>
      </div>
      <label>{{ $t('tenant.companyAdmin.form.ruleTitle') }}<input v-model="form.title" required /></label>
      <label>{{ $t('tenant.companyAdmin.form.category') }}<select v-model="form.category"><option>Warehouse</option><option>Logistics</option><option>Dispatch</option><option>Commercial</option><option>Buyer Portal</option></select></label>
      <label>{{ $t('tenant.companyAdmin.form.status') }}<select v-model="form.status"><option value="enabled">{{ $t('tenant.companyAdmin.status.enabled') }}</option><option value="disabled">{{ $t('tenant.companyAdmin.status.disabled') }}</option></select></label>
      <label class="span-2">{{ $t('tenant.companyAdmin.form.description') }}<textarea v-model="form.description" rows="3"></textarea></label>
      <div class="section-toolbar span-2">
        <button type="button" @click="showForm = false; reset()">{{ $t('common.cancel') }}</button>
        <button class="primary admin-button" type="submit">{{ $t('common.save') }}</button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.rule-card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.rule-card {
  position: relative;
  overflow: hidden;
  min-height: 220px;
  display: grid;
  align-content: start;
  gap: 8px;
}
.rule-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 5px;
  background: #2563eb;
}
.rule-card.enabled::before {
  background: #16a34a;
}
.rule-card.review::before {
  background: #f59e0b;
}
.rule-card.disabled::before {
  background: #94a3b8;
}
.rule-card > * {
  position: relative;
  z-index: 1;
}
.rule-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}
.rule-meta span {
  padding: 5px 8px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 10px;
  font-weight: 900;
}

.rule-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}
.inline-rule-editor {
  margin-top: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.rules-brief {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  background: linear-gradient(135deg, #f8fbff, #ffffff);
}
.rules-brief p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.55;
}
.rules-kpis {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.rules-kpis span {
  padding: 8px 10px;
  border: 1px solid #dbeafe;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 900;
}
@media (min-width: 1180px) {
  .rule-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 760px) {
  .rules-brief {
    align-items: flex-start;
    flex-direction: column;
  }
  .rules-kpis {
    justify-content: flex-start;
  }
}
</style>
