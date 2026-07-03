<script setup>
import { computed, reactive, ref, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/iam/application/iam.store';
import { iamApplication } from '@/iam/application/iam.application';
import { useDataStore } from '@/app/application/stores/data.store';

const router = useRouter();
const { t } = useI18n();
const auth = useAuthStore();
const ds = useDataStore();

const clientId = computed(() => auth.user?.clientId || '');
const clientOrders = computed(() => ds.D.purchaseOrders.filter(order => ds.clientRecordMatches(order, clientId.value)));
const clientInvoices = computed(() => ds.D.businessDocuments.filter(document => ds.clientRecordMatches(document, clientId.value)));
const client = computed(() => ds.clientById(clientId.value));
const contact = computed(() => ds.contactByClientId(clientId.value));
const initials = computed(() => auth.user?.initials || auth.user?.name?.split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'BP');
const saving = ref(false);
const savingAccount = ref(false);
const saved = ref(false);
const accountSaved = ref(false);
const saveError = ref('');
const editingAccount = ref(false);
const editingClientProfile = ref(false);
const changingPassword = ref(false);
const passwordSaved = ref(false);
const passwordError = ref('');
const account = reactive({ fullName: '', email: '' });
const password = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' });
const profile = reactive({
  buyerType: 'company',
  businessName: '',
  commercialName: '',
  ruc: '',
  dni: '',
  contact: '',
  contactEmail: '',
  phone: '',
  district: '',
  province: '',
  address: '',
  reference: '',
});

watchEffect(() => {
  account.fullName = auth.user?.name || auth.user?.displayName || '';
  account.email = auth.user?.email || '';
  if (!client.value) return;
  profile.buyerType = client.value.type === 'natural' ? 'natural' : 'company';
  profile.businessName = client.value.businessName || '';
  profile.commercialName = client.value.commercialName || '';
  profile.ruc = client.value.ruc || '';
  profile.dni = client.value.dni || '';
  profile.contact = client.value.contact || auth.user?.name || '';
  profile.contactEmail = client.value.contactEmail || auth.user?.email || '';
  profile.phone = client.value.phone || '';
  profile.address = client.value.address || '';
  profile.district = client.value.district || '';
  profile.province = client.value.province || '';
  profile.reference = client.value.reference || '';
});

function cancelAccountEdit() {
  account.fullName = auth.user?.name || auth.user?.displayName || '';
  account.email = auth.user?.email || '';
  editingAccount.value = false;
}

function cancelClientProfileEdit() {
  if (client.value) {
    profile.buyerType = client.value.type === 'natural' ? 'natural' : 'company';
    profile.businessName = client.value.businessName || '';
    profile.commercialName = client.value.commercialName || '';
    profile.ruc = client.value.ruc || '';
    profile.dni = client.value.dni || '';
    profile.contact = client.value.contact || auth.user?.name || '';
    profile.contactEmail = client.value.contactEmail || auth.user?.email || '';
    profile.phone = client.value.phone || '';
    profile.address = client.value.address || '';
    profile.district = client.value.district || '';
    profile.province = client.value.province || '';
    profile.reference = client.value.reference || '';
  }
  editingClientProfile.value = false;
}

async function saveAccount() {
  savingAccount.value = true;
  accountSaved.value = false;
  saveError.value = '';
  try {
    const updatedUser = await iamApplication.updateCurrentProfile({
      fullName: account.fullName,
      email: account.email,
      phone: auth.user?.phone || profile.phone,
      preferredLanguage: auth.user?.preferredLanguage || 'en',
      criticalNotificationsEnabled: auth.user?.notificationPreferences?.critical !== false,
    });
    const existingClientId = auth.user?.clientId;
    Object.assign(auth.user, updatedUser, { clientId: existingClientId });
    localStorage.setItem('nexa.user', JSON.stringify(auth.user));

    if (client.value) {
      await ds.updateCurrentBuyerProfile(client.value.id, {
        contact: account.fullName,
        contactEmail: account.email,
      });
      profile.contact = account.fullName;
      profile.contactEmail = account.email;
    }

    accountSaved.value = true;
    editingAccount.value = false;
  } catch (error) {
    saveError.value = error?.response?.data?.message || t('profile.buyer.accountSaveError');
  } finally {
    savingAccount.value = false;
  }
}

async function saveProfile() {
  if (!client.value) return;
  saving.value = true;
  saved.value = false;
  saveError.value = '';
  try {
    await ds.updateCurrentBuyerProfile(client.value.id, {
      type: profile.buyerType,
      businessName: profile.buyerType === 'company' ? profile.businessName : profile.contact,
      commercialName: profile.buyerType === 'company' ? profile.commercialName : profile.contact,
      ruc: profile.buyerType === 'company' ? profile.ruc : profile.dni,
      dni: profile.dni,
      contact: profile.contact,
      contactEmail: profile.contactEmail,
      phone: profile.phone,
      address: profile.address,
      district: profile.district,
      province: profile.province,
      reference: profile.reference,
      deliveryPreference: `${profile.district}, ${profile.province} - ${profile.reference}`,
      documentProfile: profile.buyerType === 'company' ? 'ruc_factura_xml_pdf_guia' : 'dni_factura_pdf_guia',
    });
    saved.value = true;
    editingClientProfile.value = false;
  } catch (error) {
    saveError.value = error?.response?.data?.message || t('profile.buyer.profileSaveError');
  } finally {
    saving.value = false;
  }
}

function clearPasswordFields() {
  password.currentPassword = '';
  password.newPassword = '';
  password.confirmPassword = '';
}

async function changePassword() {
  passwordError.value = '';
  passwordSaved.value = false;
  if (password.newPassword !== password.confirmPassword) {
    passwordError.value = t('profile.password.confirmMismatch');
    return;
  }
  changingPassword.value = true;
  try {
    await iamApplication.changeCurrentPassword({ ...password });
    passwordSaved.value = true;
    clearPasswordFields();
  } catch (error) {
    const message = String(error?.response?.data?.message || '');
    passwordError.value = message.includes('Current password')
      ? t('profile.password.wrongCurrent')
      : message.includes('differ')
        ? t('profile.password.mustDiffer')
        : message.includes('10 characters')
          ? t('profile.password.policy')
          : t('profile.password.error');
  } finally {
    changingPassword.value = false;
  }
}

function endSession() {
  auth.logout();
  router.push('/auth/login');
}
</script>

<template>
  <div class="buyer-profile">
    <section class="page-header">
      <div>
        <span class="eyebrow">{{ $t('profile.buyer.portal') }}</span>
        <h1>{{ $t('portal.nav.profile') }}</h1>
        <p>{{ $t('profile.buyer.subtitle') }}</p>
      </div>
    </section>

    <section class="profile-hero buyer-profile-hero">
      <div class="profile-avatar-xl">
        <span>{{ initials }}</span>
      </div>
      <div class="profile-hero-copy">
        <div class="flow-pill flow-pill-blue">{{ $t('profile.buyer.role') }}</div>
        <h1>{{ auth.user?.name || $t('profile.buyer.account') }}</h1>
        <p>{{ auth.user?.email }} · {{ $t('profile.buyer.client') }} {{ clientId || $t('profile.buyer.pendingAssignment') }}</p>
      </div>
      <div class="profile-hero-actions">
        <button class="btn btn-secondary" type="button" @click="endSession"><i class="pi pi-users" aria-hidden="true"></i> {{ $t('profile.workspace.switchAccount') }}</button>
        <button class="btn btn-logout-contrast" type="button" @click="endSession"><i class="pi pi-sign-out" aria-hidden="true"></i> {{ $t('profile.buyer.logout') }}</button>
      </div>
    </section>

    <div class="profile-grid">
      <section class="flow-panel span-6" :class="{ editing: editingAccount }">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">{{ $t('profile.buyer.accountSummary') }}</div>
            <div class="flow-subtitle">{{ $t('profile.buyer.accountSummaryDescription') }}</div>
          </div>
          <button v-if="!editingAccount" class="btn btn-secondary" type="button" @click="editingAccount = true">{{ $t('profile.workspace.editAccount') }}</button>
        </div>
        <form class="flow-panel-pad form-grid buyer-editable-grid" @submit.prevent="saveAccount">
          <label class="field"><span class="field-label">{{ $t('profile.name') }}</span><input v-model="account.fullName" class="plain-input" :disabled="!editingAccount" required /></label>
          <label class="field"><span class="field-label">{{ $t('profile.email') }}</span><input v-model="account.email" class="plain-input" type="email" :disabled="!editingAccount" required /></label>
          <label class="field"><span class="field-label">{{ $t('profile.buyer.clientIdentifier') }}</span><input class="plain-input" :value="client?.code || clientId || $t('profile.buyer.pending')" disabled /></label>
          <label class="field"><span class="field-label">{{ $t('profile.role') }}</span><input class="plain-input" :value="auth.user?.roleName || $t('profile.buyer.role')" disabled /></label>
          <div v-if="editingAccount" class="profile-form-actions span-full">
            <button class="btn btn-secondary" type="button" @click="cancelAccountEdit">{{ $t('common.cancel') }}</button>
            <button class="btn btn-primary" type="submit" :disabled="savingAccount">{{ savingAccount ? $t('profile.workspace.saving') : $t('profile.buyer.saveAccount') }}</button>
          </div>
          <p v-if="accountSaved" class="muted-text span-full" role="status">{{ $t('profile.buyer.accountUpdated') }}</p>
        </form>
      </section>

      <section class="flow-panel span-12" aria-labelledby="password-change-title">
        <div class="flow-panel-head">
          <div>
            <div id="password-change-title" class="flow-title">{{ $t('profile.security') }}</div>
            <div class="flow-subtitle">{{ $t('profile.password.description') }}</div>
          </div>
        </div>
        <form class="flow-panel-pad form-grid buyer-editable-grid" @submit.prevent="changePassword">
          <input class="sr-only" type="email" :value="auth.user?.email || ''" autocomplete="username" tabindex="-1" aria-hidden="true" readonly />
          <label class="field">
            <span class="field-label">{{ $t('profile.currentPassword') }}</span>
            <input v-model="password.currentPassword" class="plain-input" type="password" autocomplete="current-password" required />
          </label>
          <label class="field">
            <span class="field-label">{{ $t('profile.newPassword') }}</span>
            <input v-model="password.newPassword" class="plain-input" type="password" autocomplete="new-password" minlength="10" required aria-describedby="password-policy" />
          </label>
          <label class="field">
            <span class="field-label">{{ $t('profile.confirmPassword') }}</span>
            <input v-model="password.confirmPassword" class="plain-input" type="password" autocomplete="new-password" minlength="10" required />
          </label>
          <p id="password-policy" class="muted-text">{{ $t('profile.password.policy') }}</p>
          <div class="profile-form-actions span-full">
            <button class="btn btn-primary" type="submit" :disabled="changingPassword">
              {{ changingPassword ? $t('profile.workspace.saving') : $t('profile.changePassword') }}
            </button>
          </div>
          <p v-if="passwordError" class="banner banner-danger span-full" role="alert">{{ passwordError }}</p>
          <p v-if="passwordSaved" class="banner banner-success span-full" role="status">{{ $t('profile.password.success') }}</p>
        </form>
      </section>

      <section class="flow-panel span-6">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">{{ $t('profile.buyer.activity') }}</div>
            <div class="flow-subtitle">{{ $t('profile.buyer.activityDescription') }}</div>
          </div>
        </div>
        <div class="flow-panel-pad buyer-kpi-grid">
          <div class="credit-summary-box">
            <div class="mini-row"><span class="meta-label">{{ $t('profile.buyer.orders') }}</span><strong>{{ clientOrders.length }}</strong></div>
            <div class="flow-note">{{ $t('profile.buyer.ordersDescription') }}</div>
          </div>
          <div class="credit-summary-box">
            <div class="mini-row"><span class="meta-label">{{ $t('profile.buyer.invoices') }}</span><strong>{{ clientInvoices.length }}</strong></div>
            <div class="flow-note">{{ $t('profile.buyer.invoicesDescription') }}</div>
          </div>
        </div>
      </section>

      <section class="flow-panel span-12" :class="{ editing: editingClientProfile }">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">{{ $t('profile.buyer.clientProfile') }}</div>
            <div class="flow-subtitle">{{ $t('profile.buyer.clientProfileDescription') }}</div>
          </div>
          <button v-if="!editingClientProfile" class="btn btn-secondary" type="button" @click="editingClientProfile = true">{{ $t('profile.buyer.editClientProfile') }}</button>
        </div>
        <div class="flow-panel-pad form-grid">
          <div class="span-full nexa-select-grid">
            <button class="nexa-select-card" :class="{ active: profile.buyerType === 'company' }" type="button" :disabled="!editingClientProfile" @click="profile.buyerType = 'company'">
              <i class="pi pi-building"></i>
              <span><strong>{{ $t('profile.buyer.companyType') }}</strong><small>{{ $t('profile.buyer.companyTypeDescription') }}</small></span>
            </button>
            <button class="nexa-select-card" :class="{ active: profile.buyerType === 'natural' }" type="button" :disabled="!editingClientProfile" @click="profile.buyerType = 'natural'">
              <i class="pi pi-user"></i>
              <span><strong>{{ $t('profile.buyer.personType') }}</strong><small>{{ $t('profile.buyer.personTypeDescription') }}</small></span>
            </button>
          </div>
          <label v-if="profile.buyerType === 'company'" class="field"><span class="field-label">{{ $t('profile.buyer.businessName') }}</span><input v-model="profile.businessName" class="plain-input" :disabled="!editingClientProfile" /></label>
          <label v-if="profile.buyerType === 'company'" class="field"><span class="field-label">{{ $t('profile.buyer.tradeName') }}</span><input v-model="profile.commercialName" class="plain-input" :disabled="!editingClientProfile" /></label>
          <label v-if="profile.buyerType === 'company'" class="field"><span class="field-label">RUC</span><input v-model="profile.ruc" class="plain-input" inputmode="numeric" :disabled="!editingClientProfile" /></label>
          <label v-else class="field"><span class="field-label">DNI</span><input v-model="profile.dni" class="plain-input" inputmode="numeric" :disabled="!editingClientProfile" /></label>
          <label class="field"><span class="field-label">{{ $t('profile.buyer.primaryContact') }}</span><input v-model="profile.contact" class="plain-input" :disabled="!editingClientProfile" /></label>
          <label class="field"><span class="field-label">{{ $t('profile.buyer.contactEmail') }}</span><input v-model="profile.contactEmail" class="plain-input" type="email" :disabled="!editingClientProfile" /></label>
          <label class="field"><span class="field-label">{{ $t('profile.phone') }}</span><input v-model="profile.phone" class="plain-input" inputmode="tel" :disabled="!editingClientProfile" /></label>
          <label class="field"><span class="field-label">{{ $t('profile.buyer.district') }}</span><input v-model="profile.district" class="plain-input" :disabled="!editingClientProfile" /></label>
          <label class="field"><span class="field-label">{{ $t('profile.buyer.province') }}</span><input v-model="profile.province" class="plain-input" :disabled="!editingClientProfile" /></label>
          <label class="field span-full"><span class="field-label">{{ $t('profile.buyer.deliveryAddress') }}</span><input v-model="profile.address" class="plain-input" :disabled="!editingClientProfile" /></label>
          <label class="field span-full"><span class="field-label">{{ $t('profile.buyer.reference') }}</span><textarea v-model="profile.reference" rows="3" class="plain-input" :disabled="!editingClientProfile"></textarea></label>
          <div class="banner banner-info span-full" style="margin:0">
            <i class="pi pi-file-check"></i>
            <div>{{ $t('profile.buyer.documentRequirements', { documents: profile.buyerType === 'company' ? $t('profile.buyer.companyDocuments') : $t('profile.buyer.personDocuments') }) }}</div>
          </div>
          <div v-if="editingClientProfile" class="profile-form-actions span-full">
            <button class="btn btn-secondary" type="button" @click="cancelClientProfileEdit">{{ $t('common.cancel') }}</button>
            <button class="btn btn-primary" type="button" :disabled="saving" @click="saveProfile">
              <i class="pi pi-save" aria-hidden="true"></i> {{ saving ? $t('profile.workspace.saving') : $t('profile.buyer.saveClientProfile') }}
            </button>
          </div>
          <p v-if="saveError" class="banner banner-danger span-full" role="alert">{{ saveError }}</p>
          <p v-if="saved" class="muted-text span-full" role="status">{{ $t('profile.buyer.profileUpdated') }}</p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.buyer-editable-grid :deep(.field) {
  min-height: 92px;
  padding: 14px;
  border: 1px solid #dbeafe;
  border-radius: 16px;
  background: #fff;
}

.buyer-editable-grid :deep(.field.span-full) {
  min-height: auto;
}

.buyer-editable-grid :deep(.plain-input) {
  min-height: 42px;
  border-color: #c7d7ec;
  border-radius: 12px;
  background: #f8fbff;
}

.buyer-editable-grid :deep(.plain-input:focus) {
  outline: none;
  border-color: #2563eb;
  background: #fff;
}

.flow-panel {
  transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}
.flow-panel.editing {
  border-color: #93c5fd !important;
  background: radial-gradient(circle at 100% 0%, rgba(37,99,235,.08), transparent 30%), linear-gradient(180deg, #ffffff, #f8fbff) !important;
  box-shadow: 0 4px 20px -2px rgba(37,99,235,.08) !important;
}

.profile-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
