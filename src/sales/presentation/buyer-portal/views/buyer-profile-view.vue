<script setup>
import { computed, reactive, ref, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/iam/application/iam.store';
import { iamApplication } from '@/iam/application/iam.application';
import { useDataStore } from '@/app/application/stores/data.store';

const router = useRouter();
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
const account = reactive({ fullName: '', email: '' });
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
      await ds.updateClient(client.value.id, {
        contact: account.fullName,
        contactEmail: account.email,
      });
      profile.contact = account.fullName;
      profile.contactEmail = account.email;
    }

    accountSaved.value = true;
    editingAccount.value = false;
  } catch (error) {
    saveError.value = error?.response?.data?.message || error?.message || 'The account profile could not be saved.';
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
    await ds.updateClient(client.value.id, {
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
    saveError.value = error?.response?.data?.message || error?.message || 'The buyer profile could not be saved.';
  } finally {
    saving.value = false;
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
        <span class="eyebrow">Buyer Portal</span>
        <h1>{{ $t('portal.nav.profile') }}</h1>
        <p>Buyer identity comes from authenticated access; client profile details are shown for the current workspace.</p>
      </div>
    </section>

    <section class="profile-hero buyer-profile-hero">
      <div class="profile-avatar-xl">
        <span>{{ initials }}</span>
      </div>
      <div class="profile-hero-copy">
        <div class="flow-pill flow-pill-blue">B2B buyer</div>
        <h1>{{ auth.user?.name || 'Buyer account' }}</h1>
        <p>{{ auth.user?.email }} · Client {{ clientId || 'pending assignment' }}</p>
      </div>
      <div class="profile-hero-actions">
        <button class="btn btn-secondary" @click="endSession"><i class="pi pi-users"></i> Switch Account</button>
        <button class="btn btn-logout-contrast" @click="endSession"><i class="pi pi-sign-out"></i> Log Out</button>
      </div>
    </section>

    <div class="profile-grid">
      <section class="flow-panel span-6" :class="{ editing: editingAccount }">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">Account Summary</div>
            <div class="flow-subtitle">Buyer access and workspace identity for editable B2B profile data.</div>
          </div>
          <button v-if="!editingAccount" class="btn btn-secondary" type="button" @click="editingAccount = true">Edit account</button>
        </div>
        <form class="flow-panel-pad form-grid buyer-editable-grid" @submit.prevent="saveAccount">
          <label class="field"><span class="field-label">Full name</span><input v-model="account.fullName" class="plain-input" :disabled="!editingAccount" required /></label>
          <label class="field"><span class="field-label">Email</span><input v-model="account.email" class="plain-input" type="email" :disabled="!editingAccount" required /></label>
          <label class="field"><span class="field-label">Client identifier</span><input class="plain-input" :value="client?.code || clientId || 'Pending'" disabled /></label>
          <label class="field"><span class="field-label">Role</span><input class="plain-input" :value="auth.user?.roleName || 'B2B Buyer'" disabled /></label>
          <div v-if="editingAccount" class="profile-form-actions span-full">
            <button class="btn btn-secondary" type="button" @click="cancelAccountEdit">Cancel</button>
            <button class="btn btn-primary" type="submit" :disabled="savingAccount">{{ savingAccount ? 'Saving...' : 'Save account' }}</button>
          </div>
          <p v-if="accountSaved" class="muted-text span-full">Account name and email updated.</p>
        </form>
      </section>

      <section class="flow-panel span-6">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">Current Account Activity</div>
            <div class="flow-subtitle">Real orders and invoices linked to this buyer account.</div>
          </div>
        </div>
        <div class="flow-panel-pad buyer-kpi-grid">
          <div class="credit-summary-box">
            <div class="mini-row"><span class="meta-label">Orders</span><strong>{{ clientOrders.length }}</strong></div>
            <div class="flow-note">Purchase orders linked to this buyer account.</div>
          </div>
          <div class="credit-summary-box">
            <div class="mini-row"><span class="meta-label">Invoices</span><strong>{{ clientInvoices.length }}</strong></div>
            <div class="flow-note">Billing documents linked to this buyer account.</div>
          </div>
        </div>
      </section>

      <section class="flow-panel span-12" :class="{ editing: editingClientProfile }">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">Client Profile</div>
            <div class="flow-subtitle">Editable buyer data used for documents, delivery and future purchase requests.</div>
          </div>
          <button v-if="!editingClientProfile" class="btn btn-secondary" type="button" @click="editingClientProfile = true">Edit client profile</button>
        </div>
        <div class="flow-panel-pad form-grid">
          <div class="span-full nexa-select-grid">
            <button class="nexa-select-card" :class="{ active: profile.buyerType === 'company' }" type="button" :disabled="!editingClientProfile" @click="profile.buyerType = 'company'">
              <i class="pi pi-building"></i>
              <span><strong>Empresa</strong><small>Requiere RUC, razon social y documentos comerciales.</small></span>
            </button>
            <button class="nexa-select-card" :class="{ active: profile.buyerType === 'natural' }" type="button" :disabled="!editingClientProfile" @click="profile.buyerType = 'natural'">
              <i class="pi pi-user"></i>
              <span><strong>Persona natural</strong><small>Usa DNI y comprobantes simples trazables.</small></span>
            </button>
          </div>
          <label v-if="profile.buyerType === 'company'" class="field"><span class="field-label">Business name</span><input v-model="profile.businessName" class="plain-input" :disabled="!editingClientProfile" /></label>
          <label v-if="profile.buyerType === 'company'" class="field"><span class="field-label">Trade name</span><input v-model="profile.commercialName" class="plain-input" :disabled="!editingClientProfile" /></label>
          <label v-if="profile.buyerType === 'company'" class="field"><span class="field-label">RUC</span><input v-model="profile.ruc" class="plain-input" inputmode="numeric" :disabled="!editingClientProfile" /></label>
          <label v-else class="field"><span class="field-label">DNI</span><input v-model="profile.dni" class="plain-input" inputmode="numeric" :disabled="!editingClientProfile" /></label>
          <label class="field"><span class="field-label">Primary contact</span><input v-model="profile.contact" class="plain-input" :disabled="!editingClientProfile" /></label>
          <label class="field"><span class="field-label">Contact email</span><input v-model="profile.contactEmail" class="plain-input" :disabled="!editingClientProfile" /></label>
          <label class="field"><span class="field-label">Phone</span><input v-model="profile.phone" class="plain-input" :disabled="!editingClientProfile" /></label>
          <label class="field"><span class="field-label">District</span><input v-model="profile.district" class="plain-input" :disabled="!editingClientProfile" /></label>
          <label class="field"><span class="field-label">Province</span><input v-model="profile.province" class="plain-input" :disabled="!editingClientProfile" /></label>
          <label class="field span-full"><span class="field-label">Delivery address</span><input v-model="profile.address" class="plain-input" :disabled="!editingClientProfile" /></label>
          <label class="field span-full"><span class="field-label">Reference</span><textarea v-model="profile.reference" rows="3" class="plain-input" :disabled="!editingClientProfile"></textarea></label>
          <div class="banner banner-info span-full" style="margin:0">
            <i class="pi pi-file-check"></i>
            <div>This profile feeds document requirements: {{ profile.buyerType === 'company' ? 'Factura XML, factura PDF and guia PDF.' : 'Factura PDF and guia PDF.' }}</div>
          </div>
          <div v-if="editingClientProfile" class="profile-form-actions span-full">
            <button class="btn btn-secondary" type="button" @click="cancelClientProfileEdit">Cancel</button>
            <button class="btn btn-primary" type="button" :disabled="saving" @click="saveProfile">
              <i class="pi pi-save"></i> {{ saving ? 'Saving...' : 'Save buyer profile' }}
            </button>
          </div>
          <p v-if="saveError" class="banner banner-danger span-full" role="alert">{{ saveError }}</p>
          <p v-if="saved" class="muted-text span-full">Profile updated for buyer portal and client account fields.</p>
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
