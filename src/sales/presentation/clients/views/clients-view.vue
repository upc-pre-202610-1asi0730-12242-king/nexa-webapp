<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useDataStore } from '@/app/application/stores/data.store';
import { creditSummary } from '@/shared/credit';

const ds = useDataStore();
const router = useRouter();
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
  { value: 'cash', label: 'Cash before dispatch' },
  { value: 'credit_15', label: 'Credit 15 days' },
  { value: 'credit_30', label: 'Credit 30 days' },
];
const readinessStatuses = [
  { value: 'ok', label: 'Credit OK' },
  { value: 'attention', label: 'Credit attention' },
  { value: 'document_pending', label: 'Document pending' },
  { value: 'blocked', label: 'Credit blocked' },
  { value: 'overdue', label: 'Overdue balance' },
  { value: 'inactive', label: 'Inactive' },
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
    saveError.value = error?.response?.data?.message || error?.message || 'The client could not be saved.';
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
    saveError.value = error?.response?.data?.message || error?.message || 'The client could not be updated.';
  }
}

async function updateCreditStatus(client, status) {
  saveError.value = '';
  try {
    await ds.updateClient(client.id, { monthlyCreditStatus: status });
  } catch (error) {
    saveError.value = error?.response?.data?.message || error?.message || 'The credit status could not be updated.';
  }
}

function creditHoldAction(client) {
  const status = creditSummary(client).status;
  return status === 'blocked' || status === 'overdue'
    ? { status: 'ok', label: 'Resume credit', icon: 'pi pi-unlock' }
    : { status: 'blocked', label: 'Put credit on hold', icon: 'pi pi-lock' };
}

async function toggleCreditHold(client) {
  const action = creditHoldAction(client);
  await updateCreditStatus(client, action.status);
}

function paymentConditionLabel(value) {
  return {
    cash: 'Cash before dispatch',
    credit_15: 'Credit 15 days',
    credit_30: 'Credit 30 days',
  }[value] || value || 'Not configured';
}
</script>

<template>
  <div>
    <div v-if="saveError" class="banner banner-danger" role="alert">{{ saveError }}</div>
    <template v-if="viewMode === 'new'">
      <div class="page-header client-builder-header">
        <button class="btn btn-secondary" type="button" @click="cancelCreate">
          <i class="pi pi-arrow-left"></i> B2B Clients
        </button>
        <div>
          <div class="page-title">Register B2B client</div>
          <div class="page-subtitle">Create a buyer account, credit rule and portal identity for ICISA operations.</div>
        </div>
      </div>

      <section class="builder-hero">
        <div>
          <span class="eyebrow">Sales readiness</span>
          <h2>One client setup, connected to credit, delivery and buyer portal.</h2>
          <p>Use selectable business rules where possible. Seller workspace email is generated at no extra charge for buyer trust.</p>
        </div>
        <div class="hero-metrics">
          <div><strong>{{ clients.length + 1 }}</strong><span>accounts after save</span></div>
          <div><strong>@{{ workspaceEmailDomain }}</strong><span>seller identity</span></div>
        </div>
      </section>

      <form class="client-builder-shell" @submit.prevent="save">
        <aside class="builder-side">
          <article class="side-card side-card-blue">
            <i class="pi pi-check-circle"></i>
            <strong>Validation path</strong>
            <span>Credit state decides whether purchase requests pass directly to Sales validation.</span>
          </article>
          <article class="side-card side-card-green">
            <i class="pi pi-envelope"></i>
            <strong>Workspace email</strong>
            <span>No additional charge. It gives the seller a branded identity for this buyer relationship.</span>
          </article>
          <article class="side-card side-card-ice">
            <i class="pi pi-truck"></i>
            <strong>Delivery promise</strong>
            <span>Delivery window feeds portal expectations and operations planning.</span>
          </article>
        </aside>

        <section class="builder-form">
          <div class="form-section-title">
            <span>Account identity</span>
            <strong>Legal, commercial and tax information</strong>
          </div>
          <div class="form-grid">
            <label>Legal name<input v-model="form.businessName" required placeholder="Importaciones y Comercio Internacional S.A." /></label>
            <label>Trade name<input v-model="form.commercialName" required placeholder="ICISA" /></label>
            <label>RUC / Tax ID<input v-model="form.ruc" required minlength="8" maxlength="16" placeholder="20600000001" /></label>
            <label>Segment<select v-model="form.segment"><option v-for="option in segmentOptions" :key="option">{{ option }}</option></select></label>
          </div>

          <div class="form-section-title">
            <span>Buyer contact</span>
            <strong>Portal owner and commercial contact</strong>
          </div>
          <div class="form-grid">
            <label>Contact name<input v-model="form.contact" placeholder="Contact full name" /></label>
            <label>Contact email<input v-model="form.contactEmail" type="email" placeholder="compras@cliente.pe" /></label>
            <label>Phone<input v-model="form.phone" placeholder="+51 987 654 321" /></label>
            <label>Delivery window<select v-model="form.deliveryPreference"><option v-for="option in deliveryWindows" :key="option">{{ option }}</option></select></label>
          </div>

          <div class="email-generator">
            <div>
              <span>Seller workspace email</span>
              <strong>{{ form.sellerWorkspaceEmail || workspaceSellerEmail() }}</strong>
              <small>This branded email is free for the seller identity inside ICISA/Nexa.</small>
            </div>
            <button class="btn btn-secondary" type="button" @click="generateFormSellerEmail">Generate email</button>
          </div>

          <div class="form-section-title">
            <span>Sales controls</span>
            <strong>Credit and portal access</strong>
          </div>
          <div class="form-grid">
            <label>Credit condition<select v-model="form.paymentCondition"><option v-for="option in creditOptions" :key="option.value" :value="option.value">{{ option.label }}</option></select></label>
            <label>Credit limit<input v-model.number="form.monthlyCreditLimit" type="number" min="0" step="500" /></label>
            <label>Readiness<select v-model="form.monthlyCreditStatus"><option v-for="status in readinessStatuses" :key="status.value" :value="status.value">{{ status.label }}</option></select></label>
            <div class="toggle-row">
              <span>Buyer portal access</span>
              <button type="button" class="toggle-button" :class="{ on: form.portalAccess }" @click="form.portalAccess = !form.portalAccess">
                {{ form.portalAccess ? 'Enabled' : 'Disabled' }}
              </button>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn btn-secondary" type="button" @click="cancelCreate">Cancel</button>
            <button class="btn btn-primary" type="submit" :disabled="saving">{{ saving ? 'Saving...' : 'Save client' }}</button>
          </div>
        </section>
      </form>
    </template>

    <template v-else>
      <div class="page-header">
        <div>
          <div class="page-title">B2B Clients</div>
          <div class="page-subtitle">Sales account workspace for B2B buyers, credit attention, and validation readiness.</div>
        </div>
        <button class="btn btn-primary" type="button" @click="openCreate"><i class="pi pi-plus"></i> Add B2B client</button>
      </div>

      <section class="scenario-card">
        <div class="scenario-icon"><i class="pi pi-id-card"></i></div>
        <div>
          <strong>B2B account readiness</strong>
          <p>Client status, credit condition and portal access guide whether purchase requests can move into Sales validation.</p>
        </div>
      </section>

      <div class="grid-3 metrics-grid">
        <div class="card kpi-card">
          <div class="kpi-label"><i class="pi pi-users"></i> Accounts</div>
          <div class="kpi-value">{{ clients.length }}</div>
          <div class="kpi-sub">B2B buyers in commercial portfolio</div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-label"><i class="pi pi-check-circle" style="color:#16A34A"></i> Active</div>
          <div class="kpi-value" style="color:#16A34A">{{ activeCount }}</div>
          <div class="kpi-sub">Ready for request validation</div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-label"><i class="pi pi-exclamation-triangle" style="color:#F59E0B"></i> Credit review</div>
          <div class="kpi-value" style="color:#F59E0B">{{ creditRiskCount }}</div>
          <div class="kpi-sub">Need commercial attention</div>
        </div>
      </div>

      <div v-if="!clients.length" class="empty-state">
        <div class="empty-state-icon"><i class="pi pi-database"></i></div>
        <div class="empty-state-title">No B2B clients yet</div>
        <div class="empty-state-desc">Add the first client account to prepare commercial request validation.</div>
      </div>

      <div v-else class="grid-3 client-grid">
        <article v-for="client in clients" :key="client.id" class="flow-panel flow-panel-pad client-card" :class="{ editing: editingId === client.id }">
          <div class="flow-row-between card-top">
            <div>
              <div class="meta-label">Client</div>
              <h2>{{ client.commercialName || client.businessName }}</h2>
              <p class="muted-text">RUC {{ client.ruc }} · {{ client.segment }}</p>
            </div>
            <span :class="'badge ' + creditSummary(client).badgeClass">{{ creditSummary(client).statusLabel }}</span>
          </div>
          <div class="divider"></div>
          <div class="flow-stack client-facts">
            <div class="mini-row"><span>Contact</span><strong>{{ client.contact }}</strong></div>
            <div class="mini-row"><span>Condition</span><strong>{{ paymentConditionLabel(client.paymentCondition || client.condition) }}</strong></div>
            <div class="mini-row"><span>Credit available</span><strong>S/ {{ Number(client.monthlyCreditAvailable || 0).toLocaleString() }}</strong></div>
            <div class="mini-row"><span>Delivery window</span><strong>{{ client.deliveryPreference }}</strong></div>
            <div class="mini-row"><span>Portal</span><strong>{{ client.portalAccess === false ? 'Disabled' : 'Enabled' }}</strong></div>
            <div class="seller-email-card">
              <div>
                <span>Seller workspace email</span>
                <strong>{{ client.sellerWorkspaceEmail || workspaceSellerEmail(client) }}</strong>
                <small>No additional charge. It identifies the seller inside the ICISA workspace.</small>
              </div>
              <button class="btn btn-secondary" type="button" @click="generateSellerEmail(client)">Generate</button>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" type="button" @click="router.push('/ops/commercial/client-accounts/' + client.id)">Open profile</button>
            <button class="btn btn-secondary" type="button" @click="edit(client)">Edit</button>
            <button class="btn btn-ghost" type="button" @click="toggleCreditHold(client)">
              <i :class="creditHoldAction(client).icon"></i> {{ creditHoldAction(client).label }}
            </button>
            <button class="btn btn-ghost" type="button" @click="updateCreditStatus(client, 'document_pending')">Doc pending</button>
          </div>
          <form v-if="editingId === client.id" class="client-inline-editor" @submit.prevent="save">
            <label>Legal name<input v-model="form.businessName" required /></label>
            <label>Trade name<input v-model="form.commercialName" required /></label>
            <label>RUC / Tax ID<input v-model="form.ruc" required /></label>
            <label>Segment<select v-model="form.segment"><option v-for="option in segmentOptions" :key="option">{{ option }}</option></select></label>
            <label>Contact name<input v-model="form.contact" /></label>
            <label>Contact email<input v-model="form.contactEmail" type="email" /></label>
            <label>Seller workspace email<input v-model="form.sellerWorkspaceEmail" :placeholder="workspaceSellerEmail()" /></label>
            <label>Phone<input v-model="form.phone" /></label>
            <label>Credit condition<select v-model="form.paymentCondition"><option v-for="option in creditOptions" :key="option.value" :value="option.value">{{ option.label }}</option></select></label>
            <label>Credit limit<input v-model.number="form.monthlyCreditLimit" type="number" min="0" /></label>
            <label>Readiness<select v-model="form.monthlyCreditStatus"><option v-for="status in readinessStatuses" :key="status.value" :value="status.value">{{ status.label }}</option></select></label>
            <label>Delivery window<select v-model="form.deliveryPreference"><option v-for="option in deliveryWindows" :key="option">{{ option }}</option></select></label>
            <div class="toggle-row span-2">
              <span>Buyer portal access</span>
              <button type="button" class="toggle-button" :class="{ on: form.portalAccess }" @click="form.portalAccess = !form.portalAccess">
                {{ form.portalAccess ? 'Enabled' : 'Disabled' }}
              </button>
            </div>
            <div class="form-actions span-2">
              <button class="btn btn-secondary" type="button" @click="reset">Cancel</button>
              <button class="btn btn-primary" type="submit" :disabled="saving">{{ saving ? 'Saving...' : 'Save client' }}</button>
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
