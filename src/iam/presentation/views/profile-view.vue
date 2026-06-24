<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/iam/application/iam.store';
import { useDataStore } from '@/app/application/stores/data.store';
import { iamApplication } from '@/iam/application/iam.application';

const router = useRouter();
const { t } = useI18n();
const auth = useAuthStore();
const ds = useDataStore();
const editingAccount = ref(false);
const editingPreferences = ref(false);
const saved = ref(false);
const saving = ref(false);
const saveError = ref('');
const draft = reactive({ name: '', jobTitle: '', phone: '', preferredLanguage: 'en', defaultWorkspace: 'icisa', notifications: true });

const roleKey = computed(() => auth.user?.roleKey || 'commercial');
const roleTitle = computed(() => t(`profile.workspace.roles.${roleKey.value}`));
const roleToneClass = computed(() => roleKey.value === 'logistics' ? 'role-pill-logistics' : 'flow-pill-blue');
const company = computed(() => auth.tenant || ds.D.company);
const membership = computed(() => auth.membership || {});
const workspaceName = computed(() => company.value?.name || company.value?.legalName || 'Nexa');
const workspaceUrl = computed(() => company.value?.workspaceUrl || '');
const workspaceSlug = computed(() => membership.value.workspaceSlug || company.value?.slug || '');
const permissions = computed(() => {
  if (roleKey.value === 'logistics') return ['inventory', 'dispatch', 'deliveryEvidence', 'analytics'];
  if (roleKey.value === 'owner') return ['companyAdministration', 'workspaceSetup', 'teammates', 'businessRules'];
  return ['catalog', 'orders', 'manualOrder', 'documents'];
});
const preferences = computed(() => [
  { key: 'language', label: t('profile.language'), value: auth.user?.preferredLanguage || draft.preferredLanguage || 'en', editable: true, control: 'language' },
  { key: 'notifications', label: t('profile.workspace.criticalNotifications'), value: t(draft.notifications ? 'profile.workspace.enabled' : 'profile.workspace.disabled'), editable: true, control: 'notifications' },
  { key: 'role', label: t('profile.role'), value: roleTitle.value },
  { key: 'plan', label: t('profile.workspace.planAccess'), value: auth.user?.planAccess || 'standard' },
  { key: 'workspace', label: t('profile.workspace.workspaceSlug'), value: workspaceSlug.value },
]);

function syncDraft(user = auth.user) {
  draft.name = user?.name || user?.displayName || '';
  draft.jobTitle = user?.jobTitle || user?.department || roleTitle.value;
  draft.phone = user?.phone || '';
  draft.preferredLanguage = user?.preferredLanguage || 'en';
  draft.defaultWorkspace = auth.tenant?.slug || '';
  draft.notifications = user?.notificationPreferences?.critical !== false;
}

watch(
  () => auth.user,
  (user) => syncDraft(user),
  { immediate: true }
);

function cacheProfile(user) {
  Object.assign(auth.user, user);
  localStorage.setItem('nexa.user', JSON.stringify(auth.user));
  syncDraft(auth.user);
}

async function persistProfile() {
  saving.value = true;
  saveError.value = '';
  try {
    const user = await iamApplication.updateCurrentProfile({
      fullName: draft.name,
      phone: draft.phone,
      preferredLanguage: draft.preferredLanguage,
      criticalNotificationsEnabled: draft.notifications,
    });
    cacheProfile(user);
    saved.value = true;
    setTimeout(() => { saved.value = false; }, 2200);
    return true;
  } catch (error) {
    saveError.value = error?.response?.data?.message || error.message;
    return false;
  } finally {
    saving.value = false;
  }
}

async function saveProfile() {
  if (await persistProfile()) editingAccount.value = false;
}

async function savePreferences() {
  if (await persistProfile()) editingPreferences.value = false;
}

onMounted(async () => {
  try {
    cacheProfile(await iamApplication.getCurrentProfile());
  } catch (error) {
    saveError.value = error?.response?.data?.message || error.message;
  }
});

function cancelEdit() {
  syncDraft();
  editingAccount.value = false;
  editingPreferences.value = false;
}

function endSession() {
  auth.logout();
  router.push('/auth/login');
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">{{ t('profile.title') }}</div>
        <div class="page-subtitle">{{ t('profile.workspace.subtitle') }}</div>
      </div>
      <div class="profile-account-actions">
        <button class="btn btn-secondary" type="button" @click="endSession"><i class="pi pi-users"></i> {{ t('profile.workspace.switchAccount') }}</button>
        <button class="btn btn-ghost" type="button" @click="endSession"><i class="pi pi-sign-out"></i> {{ t('common.logout') }}</button>
      </div>
    </div>

    <section class="profile-hero">
      <div class="profile-avatar-xl">
        <span>{{ auth.user?.initials || 'NX' }}</span>
      </div>
      <div class="profile-hero-copy">
        <div class="flow-pill" :class="roleToneClass">{{ roleTitle }}</div>
        <h1>{{ auth.user?.name || 'Nexa user' }}</h1>
        <p>{{ workspaceName }} · {{ workspaceUrl }} · {{ auth.user?.email }}</p>
      </div>
    </section>

    <section class="scenario-card">
      <div class="scenario-icon"><i class="pi pi-user"></i></div>
      <div>
        <strong>{{ t('profile.workspace.identity') }}</strong>
        <p>{{ t('profile.workspace.identityDescription') }}</p>
      </div>
    </section>

    <div v-if="saved" class="flow-note saved-note">{{ t('profile.savedSuccess') }}</div>
    <div v-if="saveError" class="flow-note profile-error">{{ saveError }}</div>

    <div class="profile-grid">
      <section class="flow-panel span-8 profile-account-panel" :class="{ editing: editingAccount }">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">{{ t('profile.personalInfo') }}</div>
            <div class="flow-subtitle">{{ t('profile.workspace.accountDescription') }}</div>
          </div>
          <button v-if="!editingAccount" class="btn btn-secondary" type="button" @click="editingAccount = true">{{ t('profile.workspace.editAccount') }}</button>
        </div>
        <form class="flow-panel-pad form-grid profile-account-grid" @submit.prevent="saveProfile">
          <label class="field"><span class="field-label">{{ t('profile.name') }}</span><input v-model="draft.name" class="plain-input" :disabled="!editingAccount" /></label>
          <label class="field"><span class="field-label">{{ t('profile.email') }}</span><input class="plain-input" :value="auth.user?.email" disabled /></label>
          <label class="field"><span class="field-label">{{ t('profile.role') }}</span><input class="plain-input" :value="roleTitle" disabled /></label>
          <label class="field"><span class="field-label">{{ t('profile.phone') }}</span><input v-model="draft.phone" class="plain-input" :disabled="!editingAccount" /></label>
          <label class="field"><span class="field-label">{{ t('profile.workspace.workspaceSlug') }}</span><input class="plain-input" :value="workspaceSlug" disabled /></label>
          <label class="field"><span class="field-label">{{ t('profile.workspace.membershipStatus') }}</span><input class="plain-input" :value="membership.status || 'active'" disabled /></label>
          <div v-if="editingAccount" class="profile-form-actions span-full">
            <button class="btn btn-secondary" type="button" @click="cancelEdit">{{ t('common.cancel') }}</button>
            <button class="btn btn-primary" type="submit" :disabled="saving">{{ saving ? t('profile.workspace.saving') : t('profile.saveChanges') }}</button>
          </div>
        </form>
      </section>

      <section class="flow-panel span-4 profile-preferences-panel" :class="{ editing: editingPreferences }">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">{{ t('profile.workspace.preferencesTitle') }}</div>
            <div class="flow-subtitle">{{ t('profile.workspace.preferencesDescription') }}</div>
          </div>
          <button v-if="!editingPreferences" class="btn btn-secondary" type="button" @click="editingPreferences = true">{{ t('profile.workspace.editPreferences') }}</button>
        </div>
        <form class="flow-panel-pad flow-stack" @submit.prevent="savePreferences">
          <div v-for="preference in preferences" :key="preference.key" class="mini-row preference-row" :class="{ editing: editingPreferences && preference.editable }">
            <span>{{ preference.label }}</span>
            <select v-if="editingPreferences && preference.control === 'language'" v-model="draft.preferredLanguage" class="plain-input inline-preference-control"><option value="en">{{ t('profile.langEn') }}</option><option value="es">{{ t('profile.langEs') }}</option></select>
            <select v-else-if="editingPreferences && preference.control === 'notifications'" v-model="draft.notifications" class="plain-input inline-preference-control"><option :value="true">{{ t('profile.workspace.enabled') }}</option><option :value="false">{{ t('profile.workspace.disabled') }}</option></select>
            <strong v-else>{{ preference.value }}</strong>
          </div>
          <div v-if="editingPreferences" class="profile-form-actions">
            <button class="btn btn-secondary" type="button" @click="cancelEdit">{{ t('common.cancel') }}</button>
            <button class="btn btn-primary" type="submit" :disabled="saving">{{ saving ? t('profile.workspace.saving') : t('profile.workspace.savePreferences') }}</button>
          </div>
        </form>
      </section>

      <section class="flow-panel span-12">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">{{ t('profile.workspace.operationalScope') }}</div>
            <div class="flow-subtitle">{{ t('profile.workspace.scopeDescription') }}</div>
          </div>
        </div>
        <div class="flow-panel-pad permission-grid">
          <div v-for="permission in permissions" :key="permission" class="permission-chip">
            <i class="pi pi-check-circle"></i>{{ t(`profile.workspace.permissions.${permission}`) }}
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.scenario-card { display:flex; gap:14px; align-items:flex-start; margin:0 0 18px; padding:16px; border:1px solid #bfdbfe; border-radius:8px; background:#eff6ff; }
.scenario-icon { width:42px; height:42px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:white; color:#1d4ed8; }
.scenario-card strong { display:block; color:#0f172a; margin-bottom:4px; }
.scenario-card p { margin:0; color:#475569; line-height:1.55; }
.saved-note { margin-bottom:18px; border-color:#bbf7d0; background:#f0fdf4; color:#166534; }
.profile-error { margin-bottom:18px; border-color:#fecaca; background:#fff1f2; color:#be123c; }
.profile-form-actions { display:flex; justify-content:flex-end; gap:10px; }
.profile-account-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.profile-account-grid .field,
.profile-account-grid .plain-input {
  min-width: 0;
}
.profile-account-grid .plain-input {
  text-overflow: ellipsis;
}
.profile-preferences-panel {
  border-color: #bfdbfe;
  box-shadow: none;
}
.flow-panel {
  transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}
.flow-panel.editing {
  border-color: #93c5fd !important;
  background: radial-gradient(circle at 100% 0%, rgba(37,99,235,.08), transparent 30%), linear-gradient(180deg, #ffffff, #f8fbff) !important;
  box-shadow: 0 4px 20px -2px rgba(37,99,235,.08) !important;
}
.preference-row {
  min-height: 48px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}
.preference-row.editing { border-color:#93c5fd; background:#eff6ff; box-shadow:inset 0 0 0 1px #dbeafe; }
.inline-preference-control { width:min(190px,55%); min-height:36px; }
.role-pill-logistics {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
}
@media (max-width: 1180px) {
  .profile-account-panel,
  .profile-preferences-panel {
    grid-column: 1 / -1;
  }
}
@media (max-width: 720px) {
  .profile-account-grid {
    grid-template-columns: 1fr;
  }
}
</style>

