<script setup>
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useDataStore } from '@/app/application/stores/data.store';
import { creditSummary } from '@/shared/credit';

const ds = useDataStore();
const router = useRouter();
const { t } = useI18n();
const clients = computed(() => ds.D.clients);
const activeCount = computed(() => clients.value.filter(client => client.status === 'active').length);
const creditRiskCount = computed(() => clients.value.filter(client => creditSummary(client).status !== 'ok').length);
const viewMode = ref('overview');
const editingId = ref('');
const saving = ref(false);
const saveError = ref('');
const form = reactive({
  businessName: '',
  commercialName: '',
  ruc: '',
  segment: 'Gourmet / refrigerated',
  contact: '',
  contactEmail: '',
  phone: '',
  paymentCondition: 'credit_15',
  monthlyCreditLimit: 15000,
  monthlyCreditStatus: 'ok',
  deliveryPreference: 'Morning cold-chain window',
  sellerWorkspaceEmail: '',
  portalAccess: true,
  status: 'active',
});

const segmentOptions = ['Gourmet / refrigerated', 'Food service', 'Retail chilled', 'Distributor', 'Seafood buyer'];
const creditOptions = [
  { value: 'cash', labelKey: 'clients.view.payment.cash' },
  { value: 'credit_15', labelKey: 'clients.view.payment.credit15' },
  { value: 'credit_30', labelKey: 'clients.view.payment.credit30' },
];
const readinessStatuses = [
  { value: 'ok', labelKey: 'clients.view.readiness.ok' },
  { value: 'attention', labelKey: 'clients.view.readiness.attention' },
  { value: 'document_pending', labelKey: 'clients.view.readiness.documentPending' },
  { value: 'blocked', labelKey: 'clients.view.readiness.blocked' },
  { value: 'overdue', labelKey: 'clients.view.readiness.overdue' },
  { value: 'inactive', labelKey: 'clients.view.readiness.inactive' },
];
const deliveryWindows = ['Morning cold-chain window', 'Afternoon cold-chain window', 'Callao route', 'Lima Metropolitana route'];
const workspaceEmailDomain = computed(() => ds.D.company.emailDomain || 'icisa.pe');

function reset() {
  Object.assign(form, {
    businessName: '',
    commercialName: '',
    ruc: '',
    segment: 'Gourmet / refrigerated',
    contact: '',
    contactEmail: '',
    phone: '',
    paymentCondition: 'credit_15',
    monthlyCreditLimit: 15000,
    monthlyCreditStatus: 'ok',
    deliveryPreference: 'Morning cold-chain window',
    sellerWorkspaceEmail: '',
    portalAccess: true,
    status: 'active',
  });
  editingId.value = '';
}

function openCreate() {
  reset();
  form.sellerWorkspaceEmail = workspaceSellerEmail();
  viewMode.value = 'new';
}

function cancelCreate() {
  reset();
  viewMode.value = 'overview';
}

function edit(client) {
  Object.assign(form, client);
  editingId.value = client.id;
  viewMode.value = 'overview';
}

async function save() {
  saving.value = true;
  saveError.value = '';
  try {
    if (editingId.value) await ds.updateClient(editingId.value, { ...form });
    else await ds.addClient({ ...form, sellerWorkspaceEmail: form.sellerWorkspaceEmail || workspaceSellerEmail() });
    reset();
    viewMode.value = 'overview';
  } catch (error) {
    saveError.value = error?.response?.data?.message || error?.message || t('clients.view.errors.save');
  } finally {
    saving.value = false;
  }
}

function slugifyEmailPart(value) {
  return String(value || 'cliente')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 34) || 'cliente';
}

function workspaceSellerEmail(clientOrForm = form) {
  const name = clientOrForm.contact || clientOrForm.commercialName || clientOrForm.businessName;
  return `${slugifyEmailPart(name)}@${workspaceEmailDomain.value}`;
}

function generateFormSellerEmail() {
  form.sellerWorkspaceEmail = workspaceSellerEmail();
}

async function generateSellerEmail(client) {
  const email = workspaceSellerEmail(client);
  saveError.value = '';
  try {
    await ds.updateClient(client.id, { sellerWorkspaceEmail: email });
  } catch (error) {
    saveError.value = error?.response?.data?.message || error?.message || t('clients.view.errors.update');
  }
}

async function updateCreditStatus(client, status) {
  saveError.value = '';
  try {
    await ds.updateClient(client.id, { monthlyCreditStatus: status });
  } catch (error) {
    saveError.value = error?.response?.data?.message || error?.message || t('clients.view.errors.creditStatus');
  }
}

function creditHoldAction(client) {
  const status = creditSummary(client).status;
  return status === 'blocked' || status === 'overdue'
    ? { status: 'ok', label: t('clients.view.actions.resumeCredit'), icon: 'pi pi-unlock' }
    : { status: 'blocked', label: t('clients.view.actions.holdCredit'), icon: 'pi pi-lock' };
}

async function toggleCreditHold(client) {
  const action = creditHoldAction(client);
  await updateCreditStatus(client, action.status);
}

function paymentConditionLabel(value) {
  return {
    cash: t('clients.view.payment.cash'),
    credit_15: t('clients.view.payment.credit15'),
    credit_30: t('clients.view.payment.credit30'),
  }[value] || value || t('common.notConfigured');
}
</script>

<template>
  <div>
    <div v-if="saveError" class="banner banner-danger" role="alert">{{ saveError }}</div>
    <template v-if="viewMode === 'new'">
      <div class="page-header client-builder-header">
        <button class="btn btn-secondary" type="button" @click="cancelCreate">
          <i class="pi pi-arrow-left"></i> {{ t('clients.view.title') }}
        </button>
        <div>
          <div class="page-title">{{ t('clients.view.registerTitle') }}</div>
          <div class="page-subtitle">{{ t('clients.view.registerSubtitle') }}</div>
        </div>
      </div>

      <section class="builder-hero">
        <div>
          <span class="eyebrow">{{ t('clients.view.salesReadiness') }}</span>
          <h2>{{ t('clients.view.builderTitle') }}</h2>
          <p>{{ t('clients.view.builderDesc') }}</p>
        </div>
        <div class="hero-metrics">
          <div><strong>{{ clients.length + 1 }}</strong><span>{{ t('clients.view.accountsAfterSave') }}</span></div>
          <div><strong>@{{ workspaceEmailDomain }}</strong><span>{{ t('clients.view.sellerIdentity') }}</span></div>
        </div>
      </section>

      <form class="client-builder-shell" @submit.prevent="save">
        <aside class="builder-side">
          <article class="side-card side-card-blue">
            <i class="pi pi-check-circle"></i>
            <strong>{{ t('clients.view.validationPath') }}</strong>
            <span>{{ t('clients.view.validationPathDesc') }}</span>
          </article>
          <article class="side-card side-card-green">
            <i class="pi pi-envelope"></i>
            <strong>{{ t('clients.view.workspaceEmail') }}</strong>
            <span>{{ t('clients.view.workspaceEmailDesc') }}</span>
          </article>
          <article class="side-card side-card-ice">
            <i class="pi pi-truck"></i>
            <strong>{{ t('clients.view.deliveryPromise') }}</strong>
            <span>{{ t('clients.view.deliveryPromiseDesc') }}</span>
          </article>
        </aside>

        <section class="builder-form">
          <div class="form-section-title">
            <span>{{ t('clients.view.accountIdentity') }}</span>
            <strong>{{ t('clients.view.accountIdentityDesc') }}</strong>
          </div>
          <div class="form-grid">
            <label>{{ t('clients.view.fields.legalName') }}<input v-model="form.businessName" required placeholder="Importaciones y Comercio Internacional S.A." /></label>
            <label>{{ t('clients.view.fields.tradeName') }}<input v-model="form.commercialName" required placeholder="ICISA" /></label>
            <label>{{ t('clients.view.fields.taxId') }}<input v-model="form.ruc" required minlength="8" maxlength="16" placeholder="20600000001" /></label>
            <label>{{ t('clients.view.fields.segment') }}<select v-model="form.segment"><option v-for="option in segmentOptions" :key="option">{{ option }}</option></select></label>
          </div>

          <div class="form-section-title">
            <span>{{ t('clients.view.buyerContact') }}</span>
            <strong>{{ t('clients.view.buyerContactDesc') }}</strong>
          </div>
          <div class="form-grid">
            <label>{{ t('clients.view.fields.contactName') }}<input v-model="form.contact" :placeholder="t('clients.view.placeholders.contactName')" /></label>
            <label>{{ t('clients.view.fields.contactEmail') }}<input v-model="form.contactEmail" type="email" placeholder="compras@cliente.pe" /></label>
            <label>{{ t('clients.view.fields.phone') }}<input v-model="form.phone" placeholder="+51 987 654 321" /></label>
            <label>{{ t('clients.view.fields.deliveryWindow') }}<select v-model="form.deliveryPreference"><option v-for="option in deliveryWindows" :key="option">{{ option }}</option></select></label>
          </div>

          <div class="email-generator">
            <div>
              <span>{{ t('clients.view.sellerWorkspaceEmail') }}</span>
              <strong>{{ form.sellerWorkspaceEmail || workspaceSellerEmail() }}</strong>
              <small>{{ t('clients.view.sellerWorkspaceEmailHelp') }}</small>
            </div>
            <button class="btn btn-secondary" type="button" @click="generateFormSellerEmail">{{ t('clients.view.actions.generateEmail') }}</button>
          </div>

          <div class="form-section-title">
            <span>{{ t('clients.view.salesControls') }}</span>
            <strong>{{ t('clients.view.salesControlsDesc') }}</strong>
          </div>
          <div class="form-grid">
            <label>{{ t('clients.view.fields.creditCondition') }}<select v-model="form.paymentCondition"><option v-for="option in creditOptions" :key="option.value" :value="option.value">{{ t(option.labelKey) }}</option></select></label>
            <label>{{ t('clients.view.fields.creditLimit') }}<input v-model.number="form.monthlyCreditLimit" type="number" min="0" step="500" /></label>
            <label>{{ t('clients.view.fields.readiness') }}<select v-model="form.monthlyCreditStatus"><option v-for="status in readinessStatuses" :key="status.value" :value="status.value">{{ t(status.labelKey) }}</option></select></label>
            <div class="toggle-row">
              <span>{{ t('clients.view.fields.portalAccess') }}</span>
              <button type="button" class="toggle-button" :class="{ on: form.portalAccess }" @click="form.portalAccess = !form.portalAccess">
                {{ form.portalAccess ? t('common.enabled') : t('common.disabled') }}
              </button>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn btn-secondary" type="button" @click="cancelCreate">{{ t('common.cancel') }}</button>
            <button class="btn btn-primary" type="submit" :disabled="saving">{{ saving ? t('common.saving') : t('clients.view.actions.saveClient') }}</button>
          </div>
        </section>
      </form>
    </template>

    <template v-else>
      <div class="page-header">
        <div>
          <div class="page-title">{{ t('clients.view.title') }}</div>
          <div class="page-subtitle">{{ t('clients.view.subtitleLong') }}</div>
        </div>
        <button class="btn btn-primary" type="button" @click="openCreate"><i class="pi pi-plus"></i> {{ t('clients.view.actions.addClient') }}</button>
      </div>

      <section class="scenario-card">
        <div class="scenario-icon"><i class="pi pi-id-card"></i></div>
        <div>
          <strong>{{ t('clients.view.readinessTitle') }}</strong>
          <p>{{ t('clients.view.readinessDesc') }}</p>
        </div>
      </section>

      <div class="grid-3 metrics-grid">
        <div class="card kpi-card">
          <div class="kpi-label"><i class="pi pi-users"></i> {{ t('clients.view.kpi.accounts') }}</div>
          <div class="kpi-value">{{ clients.length }}</div>
          <div class="kpi-sub">{{ t('clients.view.kpi.accountsSub') }}</div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-label"><i class="pi pi-check-circle" style="color:#16A34A"></i> {{ t('clients.active') }}</div>
          <div class="kpi-value" style="color:#16A34A">{{ activeCount }}</div>
          <div class="kpi-sub">{{ t('clients.view.kpi.activeSub') }}</div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-label"><i class="pi pi-exclamation-triangle" style="color:#F59E0B"></i> {{ t('clients.view.kpi.creditReview') }}</div>
          <div class="kpi-value" style="color:#F59E0B">{{ creditRiskCount }}</div>
          <div class="kpi-sub">{{ t('clients.view.kpi.creditReviewSub') }}</div>
        </div>
      </div>

      <div v-if="!clients.length" class="empty-state">
        <div class="empty-state-icon"><i class="pi pi-database"></i></div>
        <div class="empty-state-title">{{ t('clients.view.emptyTitle') }}</div>
        <div class="empty-state-desc">{{ t('clients.view.emptyDesc') }}</div>
      </div>

      <div v-else class="grid-3 client-grid">
        <article v-for="client in clients" :key="client.id" class="flow-panel flow-panel-pad client-card" :class="{ editing: editingId === client.id }">
          <div class="flow-row-between card-top">
            <div>
              <div class="meta-label">{{ t('clients.table.client') }}</div>
              <h2>{{ client.commercialName || client.businessName }}</h2>
              <p class="muted-text">RUC {{ client.ruc }} · {{ client.segment }}</p>
            </div>
            <span :class="'badge ' + creditSummary(client).badgeClass">{{ creditSummary(client).statusLabel }}</span>
          </div>
          <div class="divider"></div>
          <div class="flow-stack client-facts">
            <div class="mini-row"><span>{{ t('clients.view.fields.contactName') }}</span><strong>{{ client.contact }}</strong></div>
            <div class="mini-row"><span>{{ t('clients.view.fields.condition') }}</span><strong>{{ paymentConditionLabel(client.paymentCondition || client.condition) }}</strong></div>
            <div class="mini-row"><span>{{ t('clients.view.fields.creditAvailable') }}</span><strong>S/ {{ Number(client.monthlyCreditAvailable || 0).toLocaleString() }}</strong></div>
            <div class="mini-row"><span>{{ t('clients.view.fields.deliveryWindow') }}</span><strong>{{ client.deliveryPreference }}</strong></div>
            <div class="mini-row"><span>{{ t('clients.view.fields.portal') }}</span><strong>{{ client.portalAccess === false ? t('common.disabled') : t('common.enabled') }}</strong></div>
            <div class="seller-email-card">
              <div>
                <span>{{ t('clients.view.sellerWorkspaceEmail') }}</span>
                <strong>{{ client.sellerWorkspaceEmail || workspaceSellerEmail(client) }}</strong>
                <small>{{ t('clients.view.sellerEmailCardHelp') }}</small>
              </div>
              <button class="btn btn-secondary" type="button" @click="generateSellerEmail(client)">{{ t('clients.view.actions.generate') }}</button>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" type="button" @click="router.push('/ops/commercial/client-accounts/' + client.id)">{{ t('clients.view.actions.openProfile') }}</button>
            <button class="btn btn-secondary" type="button" @click="edit(client)">{{ t('common.edit') }}</button>
            <button class="btn btn-ghost" type="button" @click="toggleCreditHold(client)">
              <i :class="creditHoldAction(client).icon"></i> {{ creditHoldAction(client).label }}
            </button>
            <button class="btn btn-ghost" type="button" @click="updateCreditStatus(client, 'document_pending')">{{ t('clients.view.actions.docPending') }}</button>
          </div>
          <form v-if="editingId === client.id" class="client-inline-editor" @submit.prevent="save">
            <label>{{ t('clients.view.fields.legalName') }}<input v-model="form.businessName" required /></label>
            <label>{{ t('clients.view.fields.tradeName') }}<input v-model="form.commercialName" required /></label>
            <label>{{ t('clients.view.fields.taxId') }}<input v-model="form.ruc" required /></label>
            <label>{{ t('clients.view.fields.segment') }}<select v-model="form.segment"><option v-for="option in segmentOptions" :key="option">{{ option }}</option></select></label>
            <label>{{ t('clients.view.fields.contactName') }}<input v-model="form.contact" /></label>
            <label>{{ t('clients.view.fields.contactEmail') }}<input v-model="form.contactEmail" type="email" /></label>
            <label>{{ t('clients.view.sellerWorkspaceEmail') }}<input v-model="form.sellerWorkspaceEmail" :placeholder="workspaceSellerEmail()" /></label>
            <label>{{ t('clients.view.fields.phone') }}<input v-model="form.phone" /></label>
            <label>{{ t('clients.view.fields.creditCondition') }}<select v-model="form.paymentCondition"><option v-for="option in creditOptions" :key="option.value" :value="option.value">{{ t(option.labelKey) }}</option></select></label>
            <label>{{ t('clients.view.fields.creditLimit') }}<input v-model.number="form.monthlyCreditLimit" type="number" min="0" /></label>
            <label>{{ t('clients.view.fields.readiness') }}<select v-model="form.monthlyCreditStatus"><option v-for="status in readinessStatuses" :key="status.value" :value="status.value">{{ t(status.labelKey) }}</option></select></label>
            <label>{{ t('clients.view.fields.deliveryWindow') }}<select v-model="form.deliveryPreference"><option v-for="option in deliveryWindows" :key="option">{{ option }}</option></select></label>
            <div class="toggle-row span-2">
              <span>{{ t('clients.view.fields.portalAccess') }}</span>
              <button type="button" class="toggle-button" :class="{ on: form.portalAccess }" @click="form.portalAccess = !form.portalAccess">
                {{ form.portalAccess ? t('common.enabled') : t('common.disabled') }}
              </button>
            </div>
            <div class="form-actions span-2">
              <button class="btn btn-secondary" type="button" @click="reset">{{ t('common.cancel') }}</button>
              <button class="btn btn-primary" type="submit" :disabled="saving">{{ saving ? t('common.saving') : t('clients.view.actions.saveClient') }}</button>
            </div>
          </form>
        </article>
      </div>
    </template>
  </div>
</template>

<style scoped>
.client-builder-header {
  display:grid;
  grid-template-columns:auto minmax(0,1fr);
  justify-content:start;
  align-items:start;
  gap:18px;
}
.builder-hero {
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:20px;
  align-items:center;
  margin:0 0 18px;
  padding:22px;
  border:1px solid #bfdbfe;
  border-radius:22px;
  background:linear-gradient(135deg,#eff6ff,#f8fafc 58%,#ecfeff);
  box-shadow:0 18px 45px rgba(37,99,235,.08);
}
.eyebrow { color:#2563eb; font-size:12px; font-weight:900; text-transform:uppercase; }
.builder-hero h2 { margin:6px 0 8px; color:#0f172a; font-size:24px; letter-spacing:0; }
.builder-hero p { margin:0; color:#53657f; line-height:1.55; max-width:780px; }
.hero-metrics { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; min-width:360px; }
.hero-metrics div { padding:16px; border:1px solid #dbeafe; border-radius:18px; background:rgba(255,255,255,.76); }
.hero-metrics strong { display:block; color:#1d4ed8; font-size:20px; overflow-wrap:anywhere; }
.hero-metrics span { color:#64748b; font-size:12px; font-weight:800; }
.client-builder-shell { display:grid; grid-template-columns:300px minmax(0,1fr); gap:18px; align-items:start; }
.builder-side { display:grid; gap:12px; position:sticky; top:18px; }
.side-card { display:grid; gap:10px; padding:18px; border-radius:20px; border:1px solid #dbeafe; background:#fff; box-shadow:0 14px 34px rgba(15,23,42,.06); }
.side-card i { width:42px; height:42px; display:flex; align-items:center; justify-content:center; border-radius:14px; }
.side-card strong { color:#0f172a; }
.side-card span { color:#64748b; line-height:1.45; }
.side-card-blue i { background:#dbeafe; color:#1d4ed8; }
.side-card-green { border-color:#bbf7d0; }
.side-card-green i { background:#dcfce7; color:#16a34a; }
.side-card-ice i { background:#cffafe; color:#0891b2; }
.builder-form { padding:22px; border:1px solid #cfe0f4; border-radius:22px; background:#fff; box-shadow:0 16px 42px rgba(15,23,42,.07); }
.form-section-title { display:flex; justify-content:space-between; gap:14px; align-items:end; margin:4px 0 12px; padding-top:6px; border-top:1px solid #edf3fb; }
.form-section-title:first-child { border-top:0; padding-top:0; }
.form-section-title span { color:#2563eb; font-size:12px; font-weight:900; text-transform:uppercase; }
.form-section-title strong { color:#0f172a; font-size:14px; }
.form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; margin-bottom:18px; }
.form-grid label,
.client-inline-editor label {
  display:grid;
  gap:8px;
  color:#334155;
  font-size:12px;
  font-weight:900;
}
.form-grid input,
.form-grid select,
.client-inline-editor input,
.client-inline-editor select {
  width:100%;
  min-height:52px;
  border:1px solid #cbd8ea;
  border-radius:16px;
  padding:0 14px;
  background:linear-gradient(180deg,#fff,#f8fbff);
  box-sizing:border-box;
  color:#0f172a;
  font-weight:700;
  outline:none;
}
.form-grid input:focus,
.form-grid select:focus,
.client-inline-editor input:focus,
.client-inline-editor select:focus {
  border-color:#60a5fa;
  box-shadow:0 0 0 4px rgba(59,130,246,.14);
}
.email-generator,
.seller-email-card {
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:14px;
  align-items:center;
  justify-content:space-between;
  padding:16px;
  border:1px solid #bfdbfe;
  border-radius:18px;
  background:linear-gradient(135deg,#eff6ff,#fff);
}
.email-generator { margin-bottom:18px; }
.email-generator span,
.seller-email-card span { display:block; color:#2563eb; font-size:11px; font-weight:900; text-transform:uppercase; }
.email-generator strong,
.seller-email-card strong { display:block; margin-top:4px; color:#0f172a; font-size:15px; overflow-wrap:anywhere; }
.email-generator small,
.seller-email-card small { display:block; margin-top:3px; color:#64748b; line-height:1.35; }
.scenario-card { display:flex; gap:14px; align-items:flex-start; margin:0 0 18px; padding:16px; border:1px solid #bbf7d0; border-radius:18px; background:linear-gradient(135deg,#f0fdf4,#f8fafc); color:#14532d; }
.scenario-icon { width:42px; height:42px; border-radius:14px; display:flex; align-items:center; justify-content:center; background:white; color:#16a34a; box-shadow:0 8px 18px rgba(22,163,74,.10); }
.scenario-card strong { display:block; color:#0f172a; margin-bottom:4px; }
.scenario-card p { margin:0; color:#475569; line-height:1.55; }
.metrics-grid { margin-bottom:18px; }
.toggle-row { min-height:52px; display:flex; align-items:center; justify-content:space-between; gap:10px; padding:9px 14px; border:1px solid #cbd8ea; border-radius:16px; background:linear-gradient(180deg,#fff,#f8fbff); color:#334155; font-size:12px; font-weight:900; }
.toggle-button { min-width:88px; min-height:34px; border:1px solid #cbd5e1; border-radius:999px; background:#f8fafc; color:#475569; font-size:12px; font-weight:900; cursor:pointer; }
.toggle-button.on { background:#dcfce7; border-color:#86efac; color:#15803d; }
.span-2 { grid-column:1/-1; }
.form-actions { display:flex; justify-content:flex-end; gap:10px; flex-wrap:wrap; margin-top:14px; }
.client-grid { align-items:start; }
.client-card { transition:border-color .18s ease, box-shadow .18s ease, transform .18s ease; }
.client-card.editing { border-color:#93c5fd; box-shadow:0 18px 40px rgba(37,99,235,.10); }
.card-top { align-items:flex-start; }
.card-top h2 { margin:6px 0 4px; }
.client-facts { gap:9px; }
.divider { margin:14px 0; }
.seller-email-card { align-items:flex-start; padding:14px; }
.seller-email-card .btn { flex:0 0 auto; }
.client-inline-editor { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; margin-top:18px; padding-top:18px; border-top:1px solid #dbe5f2; }
@media (max-width:1100px){
  .client-builder-shell { grid-template-columns:1fr; }
  .builder-side { position:static; grid-template-columns:repeat(3,minmax(0,1fr)); }
  .hero-metrics { min-width:0; }
}
@media (max-width:760px){
  .builder-hero { grid-template-columns:1fr; padding:18px; }
  .hero-metrics,
  .builder-side,
  .form-grid,
  .client-inline-editor { grid-template-columns:1fr; }
  .span-2 { grid-column:auto; }
  .email-generator,
  .seller-email-card { grid-template-columns:1fr; align-items:flex-start; }
}
</style>

