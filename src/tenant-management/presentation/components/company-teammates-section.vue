<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { iamApplication } from '@/iam/application/iam.application';

const props = defineProps({
  teammates: { type: Array, required: true },
  autoOpen: { type: Boolean, default: false },
});
const emit = defineEmits(['add-teammate', 'update-teammate', 'remove-teammate']);
const showForm = ref(false);
const editingId = ref('');
const error = ref('');
const selectedRole = ref('all');
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'Logistics Manager',
  roleKey: 'logistics',
  department: 'Operations',
  workspaceAccess: 'icisa',
  status: 'invited',
});
const roleCards = [
  { key: 'CompanyOwner', role: 'Company Owner', icon: 'pi-building', tone: 'owner', access: ['workspaceSetup', 'billingPreview', 'companyRules'] },
  { key: 'LogisticsManager', role: 'Logistics Manager', icon: 'pi-truck', tone: 'logistics', access: ['inventory', 'dispatch', 'podEvidence'] },
  { key: 'CommercialCoordinator', role: 'Sales', icon: 'pi-briefcase', tone: 'commercial', access: ['clients', 'purchaseRequests', 'promotions'] },
  { key: 'B2BBuyer', role: 'B2B Buyer', icon: 'pi-shopping-cart', tone: 'buyer', access: ['buyerPortal', 'orders', 'documents'] },
  { key: 'Viewer', role: 'Viewer', icon: 'pi-eye', tone: 'viewer', access: ['readOnlyViews', 'statusTracking', 'reports'] },
];
const filteredTeammates = computed(() => {
  if (selectedRole.value === 'all') return props.teammates;
  return props.teammates.filter(member => member.role === selectedRole.value);
});
const activeCount = computed(() => props.teammates.filter(member => member.status === 'active').length);

watch(
  () => props.autoOpen,
  (value) => {
    if (value) {
      reset();
      showForm.value = true;
    }
  },
  { immediate: true }
);

function reset() {
  Object.assign(form, {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Logistics Manager',
    roleKey: 'logistics',
    department: 'Operations',
    workspaceAccess: 'icisa',
    status: 'invited',
  });
  editingId.value = '';
  error.value = '';
}

function beginAdd(role = 'Logistics Manager') {
  reset();
  form.role = role;
  syncRole();
  form.department = role === 'Sales' ? 'Sales' : role === 'B2B Buyer' ? 'Buyer Portal' : 'Operations';
  form.status = role === 'B2B Buyer' ? 'invited' : 'active';
  showForm.value = true;
}

function edit(member) {
  const [firstName, ...rest] = String(member.name || '').split(' ');
  Object.assign(form, {
    firstName,
    lastName: rest.join(' '),
    email: member.email || '',
    password: '',
    role: member.role || 'Viewer',
    roleKey: member.roleKey || 'viewer',
    department: member.department || 'Operations',
    workspaceAccess: member.workspaceAccess || 'icisa',
    status: member.status || 'active',
  });
  editingId.value = member.id;
  showForm.value = false;
}

function syncRole() {
  const map = {
    'Company Owner': 'commercial',
    Sales: 'commercial',
    'Logistics Manager': 'logistics',
    'B2B Buyer': 'buyer',
    Viewer: 'viewer',
  };
  form.roleKey = map[form.role] || 'viewer';
}

function save() {
  error.value = '';
  if (!form.email || iamApplication.isPersonalEmail(form.email)) {
    error.value = 'tenant.registration.validation.personalEmail';
    return;
  }
  if (!editingId.value && !form.password) {
    error.value = 'tenant.registration.validation.passwordRequired';
    return;
  }
  syncRole();
  const payload = { ...form, name: `${form.firstName} ${form.lastName}`.trim() };
  if (editingId.value) delete payload.password;
  if (editingId.value) emit('update-teammate', editingId.value, payload);
  else emit('add-teammate', payload);
  reset();
  showForm.value = false;
}
</script>

<template>
  <section class="admin-section">
    <div class="teammate-hero section-card">
      <div>
        <span>{{ $t('tenant.companyAdmin.teammatesHero.eyebrow') }}</span>
        <h3>{{ $t('tenant.companyAdmin.sections.teammates') }}</h3>
        <p>{{ $t('tenant.companyAdmin.teammatesHero.desc') }}</p>
      </div>
      <div class="teammate-kpis">
        <strong>{{ teammates.length }}<small>{{ $t('tenant.companyAdmin.teammatesHero.members') }}</small></strong>
        <strong>{{ activeCount }}<small>{{ $t('tenant.companyAdmin.status.active') }}</small></strong>
        <strong>{{ teammates.filter(member => member.role === 'B2B Buyer').length }}<small>B2B</small></strong>
      </div>
    </div>

    <div class="role-card-grid">
      <article v-for="role in roleCards" :key="role.key" class="role-card" :class="role.tone">
        <i :class="'pi ' + role.icon" aria-hidden="true"></i>
        <strong>{{ $t(`tenant.companyAdmin.roles.${role.key}`) }}</strong>
        <span>{{ $t(`tenant.companyAdmin.roleDescriptions.${role.key}`) }}</span>
        <div class="role-access">
          <small v-for="item in role.access" :key="item">{{ $t(`tenant.companyAdmin.roleAccess.${item}`) }}</small>
        </div>
        <button type="button" class="admin-button ghost" @click="beginAdd(role.role)">{{ $t('tenant.companyAdmin.actions.registerTeammate') }}</button>
      </article>
    </div>

    <div class="section-toolbar">
      <div class="role-filter">
        <button type="button" :class="{ active: selectedRole === 'all' }" @click="selectedRole = 'all'">{{ $t('common.all') }}</button>
        <button v-for="role in roleCards" :key="role.role" type="button" :class="{ active: selectedRole === role.role }" @click="selectedRole = role.role">{{ $t(`tenant.companyAdmin.roles.${role.key}`) }}</button>
      </div>
      <button type="button" class="admin-button primary" @click="beginAdd()">{{ $t('tenant.companyAdmin.actions.registerTeammate') }}</button>
    </div>

    <form v-if="showForm && !editingId" class="admin-form admin-editor-panel member-editor new-member-editor" @submit.prevent="save">
      <div class="editor-heading span-2">
        <strong>{{ $t('tenant.companyAdmin.actions.registerTeammate') }}</strong>
        <span>{{ $t('tenant.companyAdmin.teammatesHero.workspaceAccess') }}</span>
      </div>
      <label>{{ $t('tenant.companyAdmin.form.firstName') }}<input v-model="form.firstName" required /></label>
      <label>{{ $t('tenant.companyAdmin.form.lastName') }}<input v-model="form.lastName" required /></label>
      <label class="span-2">{{ $t('tenant.companyAdmin.form.corporateEmail') }}<input v-model="form.email" type="email" required /></label>
      <label class="span-2">{{ $t('tenant.companyAdmin.form.password') }}<input v-model="form.password" type="password" autocomplete="new-password" required /></label>
      <label>{{ $t('tenant.companyAdmin.form.role') }}<select v-model="form.role" @change="syncRole"><option value="Company Owner">{{ $t('tenant.companyAdmin.roles.CompanyOwner') }}</option><option value="Logistics Manager">{{ $t('tenant.companyAdmin.roles.LogisticsManager') }}</option><option value="Sales">{{ $t('tenant.companyAdmin.roles.CommercialCoordinator') }}</option><option value="B2B Buyer">{{ $t('tenant.companyAdmin.roles.B2BBuyer') }}</option><option value="Viewer">{{ $t('tenant.companyAdmin.roles.Viewer') }}</option></select></label>
      <label>{{ $t('tenant.companyAdmin.form.department') }}<input v-model="form.department" /></label>
      <label>{{ $t('tenant.companyAdmin.form.workspaceAccess') }}<input v-model="form.workspaceAccess" /></label>
      <label>{{ $t('tenant.companyAdmin.form.status') }}<select v-model="form.status"><option value="active">{{ $t('tenant.companyAdmin.status.active') }}</option><option value="invited">{{ $t('tenant.companyAdmin.status.invited') }}</option><option value="disabled">{{ $t('tenant.companyAdmin.status.disabled') }}</option></select></label>
      <small v-if="error" class="span-2 field-error">{{ $t(error) }}</small>
      <div class="section-toolbar span-2">
        <button type="button" @click="showForm = false; reset()">{{ $t('common.cancel') }}</button>
        <button class="primary admin-button" type="submit">{{ $t('common.save') }}</button>
      </div>
    </form>

    <div class="member-grid">
      <article v-for="member in filteredTeammates" :key="member.id" class="member-card">
        <div class="member-top">
          <div class="member-avatar">{{ member.name.split(' ').map(part => part[0]).join('').slice(0, 2) }}</div>
          <div>
            <strong>{{ member.name }}</strong>
            <small>{{ member.email || member.workspaceAccess || 'icisa' }}</small>
          </div>
          <span class="status-pill" :class="member.status">{{ $t(`tenant.companyAdmin.status.${member.status}`) }}</span>
        </div>
        <div class="member-meta">
          <span>{{ member.role }}</span>
          <span>{{ member.department || member.roleKey }}</span>
          <span>{{ member.workspaceAccess || 'icisa' }}</span>
        </div>
        <div class="member-access">
          <small v-for="item in (roleCards.find(role => role.role === member.role)?.access || ['workspaceVisibility'])" :key="item">{{ $t(`tenant.companyAdmin.roleAccess.${item}`) }}</small>
        </div>
        <div class="row-actions">
          <button type="button" class="admin-button" @click="edit(member)">{{ $t('common.edit') }}</button>
          <button type="button" class="admin-button danger" :disabled="member.status === 'disabled'" @click="emit('remove-teammate', member.id)">{{ $t('tenant.companyAdmin.actions.deactivate') }}</button>
        </div>
        <form v-if="editingId === member.id" class="admin-form admin-editor-panel member-editor inline-member-editor" @submit.prevent="save">
          <div class="editor-heading span-2">
            <strong>{{ $t('common.edit') }} · {{ member.name }}</strong>
            <span>{{ member.role }}</span>
          </div>
          <label>{{ $t('tenant.companyAdmin.form.firstName') }}<input v-model="form.firstName" required /></label>
          <label>{{ $t('tenant.companyAdmin.form.lastName') }}<input v-model="form.lastName" required /></label>
          <label class="span-2">{{ $t('tenant.companyAdmin.form.corporateEmail') }}<input v-model="form.email" type="email" required /></label>
          <label>{{ $t('tenant.companyAdmin.form.role') }}<select v-model="form.role" @change="syncRole"><option value="Company Owner">{{ $t('tenant.companyAdmin.roles.CompanyOwner') }}</option><option value="Logistics Manager">{{ $t('tenant.companyAdmin.roles.LogisticsManager') }}</option><option value="Sales">{{ $t('tenant.companyAdmin.roles.CommercialCoordinator') }}</option><option value="B2B Buyer">{{ $t('tenant.companyAdmin.roles.B2BBuyer') }}</option><option value="Viewer">{{ $t('tenant.companyAdmin.roles.Viewer') }}</option></select></label>
          <label>{{ $t('tenant.companyAdmin.form.department') }}<input v-model="form.department" /></label>
          <label>{{ $t('tenant.companyAdmin.form.workspaceAccess') }}<input v-model="form.workspaceAccess" /></label>
          <label>{{ $t('tenant.companyAdmin.form.status') }}<select v-model="form.status"><option value="active">{{ $t('tenant.companyAdmin.status.active') }}</option><option value="invited">{{ $t('tenant.companyAdmin.status.invited') }}</option><option value="disabled">{{ $t('tenant.companyAdmin.status.disabled') }}</option></select></label>
          <small v-if="error" class="span-2 field-error">{{ $t(error) }}</small>
          <div class="section-toolbar span-2">
            <button type="button" @click="showForm = false; reset()">{{ $t('common.cancel') }}</button>
            <button class="primary admin-button" type="submit">{{ $t('common.save') }}</button>
          </div>
        </form>
      </article>
    </div>
  </section>
</template>

<style scoped>
.teammate-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  background:
    radial-gradient(circle at 100% 0%, rgba(37,99,235,.10), transparent 30%),
    linear-gradient(135deg, #f8fbff, #ffffff);
}
.teammate-hero > div:first-child > span {
  color: #2563eb;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}
.teammate-hero p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.55;
}
.teammate-kpis {
  display: flex;
  gap: 10px;
}
.teammate-kpis strong {
  min-width: 74px;
  margin: 0;
  padding: 10px;
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: #eff6ff;
  color: #1d4ed8;
  text-align: center;
  font-size: 20px;
}
.teammate-kpis small {
  display: block;
  margin-top: 3px;
  font-size: 10px;
  text-transform: uppercase;
}
.role-card-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.role-card {
  display: grid;
  gap: 8px;
  align-content: start;
  min-height: 214px;
  border: 1px solid #dbe5f2;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff, #f8fbff);
  padding: 16px;
}

.role-card .pi {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #eff6ff;
  color: #1d4ed8;
}

.role-card strong {
  color: #0f172a;
  font-size: 13px;
  line-height: 1.25;
}

.role-card span {
  color: #64748b;
  font-size: 12px;
  line-height: 1.4;
}
.role-access,
.member-access {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}
.role-access small,
.member-access small {
  padding: 5px 8px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 10px;
  font-weight: 900;
}

.row-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.role-filter {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-start;
}
.role-filter button {
  min-height: 34px;
  padding: 0 11px;
  border: 1px solid #d7deea;
  border-radius: 999px;
  background: #fff;
  color: #475569;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}
.role-filter button.active {
  border-color: #93c5fd;
  background: #eff6ff;
  color: #1d4ed8;
}
.member-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.member-card {
  display: grid;
  gap: 14px;
  align-content: start;
  border: 1px solid #dbe5f2;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff, #fbfdff);
  padding: 16px;
  box-shadow: 0 12px 28px rgba(15,23,42,.045);
}
.member-top {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}
.member-avatar {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #bfdbfe;
  border-radius: 14px;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 900;
}
.member-top strong {
  margin: 0;
}
.member-top small {
  display: block;
  margin-top: 3px;
}
.member-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.member-meta span {
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
.member-editor {
  margin-top: 0;
}
.inline-member-editor {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field-error {
  color: #b91c1c;
}

button:disabled {
  opacity: .45;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .role-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .member-grid {
    grid-template-columns: 1fr;
  }
  .teammate-hero {
    grid-template-columns: 1fr;
  }
  .teammate-kpis {
    flex-wrap: wrap;
  }
  .member-meta {
    grid-template-columns: 1fr;
  }

  .row-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 560px) {
  .role-card-grid {
    grid-template-columns: 1fr;
  }
}
</style>

