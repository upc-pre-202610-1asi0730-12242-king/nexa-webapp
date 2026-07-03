<script setup>
import { reactive, ref, watch } from 'vue';

const props = defineProps({ preferences: { type: Object, required: true } });
const emit = defineEmits(['update-preferences']);
const editingGroup = ref('');
const draft = reactive({});

const groups = [
  {
    key: 'regional',
    rows: [
      { key: 'language', options: ['English / Spanish', 'English', 'Español'] },
      { key: 'timezone', options: ['America/Lima', 'America/Bogota', 'UTC'] },
      { key: 'country', options: ['Peru', 'Chile', 'Colombia'] },
      { key: 'currency', options: ['PEN', 'USD'] },
      { key: 'dateFormat', options: ['DD/MM/YYYY', 'YYYY-MM-DD'] },
    ],
  },
  {
    key: 'units',
    rows: [
      { key: 'temperatureUnit', options: ['Celsius', 'Fahrenheit'] },
      { key: 'weightUnit', options: ['Kilograms', 'Pounds'] },
      { key: 'capacityUnit', options: ['Pallets', 'Cubic meters'] },
      { key: 'palletUnit', options: ['Standard pallet', 'Euro pallet'] },
    ],
  },
  {
    key: 'notifications',
    rows: [
      { key: 'temperatureAlerts', boolean: true },
      { key: 'dispatchUpdates', boolean: true },
      { key: 'purchaseRequestChanges', boolean: true },
      { key: 'documentReminders', boolean: true },
    ],
  },
  {
    key: 'behavior',
    rows: [
      { key: 'rememberWorkspace', boolean: true },
      { key: 'showOnboardingChecklist', boolean: true },
      { key: 'defaultDashboard', options: ['Operations dashboard', 'Commercial dashboard', 'Inventory control'] },
      { key: 'compactTables', boolean: true },
    ],
  },
  {
    key: 'security',
    rows: [
      { key: 'requireCorporateEmail', boolean: true },
      { key: 'sessionTimeout', options: ['30 minutes', '2 hours', '8 hours'] },
      { key: 'auditTrail', boolean: true },
      { key: 'buyerPortalApproval', boolean: true },
    ],
  },
];

watch(() => props.preferences, value => Object.assign(draft, value), { immediate: true });

function cancel() {
  Object.assign(draft, props.preferences);
  editingGroup.value = '';
}

function save() {
  emit('update-preferences', { ...draft });
  editingGroup.value = '';
}
</script>

<template>
  <section class="admin-section">
    <div class="section-card preferences-brief">
      <div>
        <h3>{{ $t('tenant.companyAdmin.preferencesBrief.title') }}</h3>
        <p>{{ $t('tenant.companyAdmin.preferencesBrief.desc') }}</p>
      </div>
      <span>{{ Object.values(preferences).filter(value => value === true).length }} {{ $t('common.enabled') }}</span>
    </div>

    <form class="preferences-grid" @submit.prevent="save">
      <section v-for="group in groups" :key="group.key" class="section-card preference-group" :class="{ editing: editingGroup === group.key }">
        <div class="preference-group-head">
          <h3>{{ $t(`tenant.companyAdmin.preferenceGroups.${group.key}`) }}</h3>
          <button v-if="editingGroup !== group.key" type="button" class="admin-button ghost" @click="editingGroup = group.key">{{ $t('common.edit') }}</button>
        </div>
        <div v-for="row in group.rows" :key="row.key" class="admin-setting-row">
          <div class="admin-setting-copy">
            <strong>{{ $t(`tenant.companyAdmin.preferences.${row.key}`) }}</strong>
            <span>{{ $t(`tenant.companyAdmin.preferencesDesc.${row.key}`) }}</span>
          </div>
          <button v-if="editingGroup === group.key && row.boolean" type="button" class="toggle-button" :class="{ on: draft[row.key] }" @click="draft[row.key] = !draft[row.key]">
            {{ draft[row.key] ? $t('common.enabled') : $t('common.disabled') }}
          </button>
          <select v-else-if="editingGroup === group.key" v-model="draft[row.key]" class="admin-inline-control">
            <option v-for="option in row.options" :key="option">{{ option }}</option>
          </select>
          <strong v-else>{{ typeof preferences[row.key] === 'boolean' ? (preferences[row.key] ? $t('common.enabled') : $t('common.disabled')) : preferences[row.key] }}</strong>
        </div>
        <div v-if="editingGroup === group.key" class="section-toolbar card-actions">
          <button type="button" @click="cancel">{{ $t('common.cancel') }}</button>
          <button class="primary admin-button" type="submit">{{ $t('common.save') }}</button>
        </div>
      </section>
    </form>
  </section>
</template>

<style scoped>
.preferences-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.preferences-brief {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  background: linear-gradient(135deg, #f8fbff, #ffffff);
}
.preferences-brief p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.55;
}
.preferences-brief > span {
  padding: 8px 10px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 900;
}
.preference-group {
  min-height: 300px;
}
.preference-group.editing {
  border-color: #93c5fd;
  background:
    radial-gradient(circle at 100% 0%, rgba(37,99,235,.08), transparent 30%),
    linear-gradient(180deg, #ffffff, #f8fbff);
}
.preference-group-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  margin-bottom: 8px;
}
.preference-group-head h3 {
  margin: 0;
}
.card-actions {
  margin-top: 12px;
  justify-content: flex-end;
}
@media (max-width: 1180px) {
  .preferences-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 900px) {
  .preferences-grid {
    grid-template-columns: 1fr;
  }
  .preferences-brief {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
