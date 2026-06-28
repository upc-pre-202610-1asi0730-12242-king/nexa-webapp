<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDataStore } from '@/app/application/stores/data.store';
import { creditSummary } from '@/shared/credit';
import { displayCode, orderStatusLabel, documentStatusLabel } from '@/shared/status';

const route = useRoute();
const router = useRouter();
const ds = useDataStore();
const saving = ref(false);
const saveError = ref('');
const saved = ref(false);

const client = computed(() => ds.clientById(route.params.id));
const orders = computed(() => client.value ? ds.D.purchaseOrders.filter(order => ds.clientRecordMatches(order, client.value.id)) : []);
const documents = computed(() => client.value ? ds.D.businessDocuments.filter(document => ds.clientRecordMatches(document, client.value.id)) : []);
const credit = computed(() => creditSummary(client.value || {}));
const form = reactive({
  businessName: '',
  commercialName: '',
  ruc: '',
  segment: '',
  contact: '',
  contactEmail: '',
  phone: '',
  paymentCondition: '',
  monthlyCreditLimit: 0,
  monthlyCreditUsed: 0,
  monthlyCreditStatus: 'ok',
  deliveryPreference: '',
  address: '',
  district: '',
  province: '',
  deliveryReference: '',
  portalAccess: true,
  status: 'active',
});

function syncForm(value) {
  if (!value) return;
  Object.assign(form, {
    businessName: value.businessName || '',
    commercialName: value.commercialName || value.name || '',
    ruc: value.ruc || '',
    segment: value.segment || '',
    contact: value.contact || '',
    contactEmail: value.contactEmail || '',
    phone: value.phone || '',
    paymentCondition: value.paymentCondition || value.condition || 'credit_15',
    monthlyCreditLimit: Number(value.monthlyCreditLimit || value.creditLimit || 0),
    monthlyCreditUsed: Number(value.monthlyCreditUsed || value.creditUsed || 0),
    monthlyCreditStatus: value.monthlyCreditStatus || value.creditStatus || 'ok',
    deliveryPreference: value.deliveryPreference || '',
    address: value.address || '',
    district: value.district || '',
    province: value.province || '',
    deliveryReference: value.deliveryReference || value.reference || '',
    portalAccess: value.portalAccess !== false,
    status: value.status || 'active',
  });
}

watch(client, syncForm, { immediate: true });

onMounted(async () => {
  if (!client.value) await ds.refreshCoreCollections();
});

async function save() {
  if (!client.value) return;
  saving.value = true;
  saveError.value = '';
  saved.value = false;
  try {
    await ds.updateClient(client.value.id, { ...form });
    saved.value = true;
  } catch (error) {
    saveError.value = error?.response?.data?.message || error?.message || 'Client profile could not be saved.';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div v-if="!client" class="empty-state">
    <div class="empty-state-icon"><i class="pi pi-building"></i></div>
    <div class="empty-state-title">Client account not found</div>
    <div class="empty-state-desc">Return to client accounts and select an active B2B account.</div>
    <button class="btn btn-primary" type="button" @click="router.push('/ops/commercial/client-accounts')">Back to clients</button>
  </div>

  <div v-else>
    <div class="page-header">
      <div>
        <div class="page-title">{{ client.commercialName || client.businessName }}</div>
        <div class="page-subtitle">B2B client profile for credit, delivery, documents and buyer portal operations.</div>
      </div>
      <button class="btn btn-secondary" type="button" @click="router.push('/ops/commercial/client-accounts')">
        <i class="pi pi-arrow-left"></i> Client accounts
      </button>
    </div>

    <div class="client-profile-grid">
      <section class="flow-panel span-4">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">Account summary</div>
            <div class="flow-subtitle">Current commercial state.</div>
          </div>
          <span :class="'badge ' + credit.badgeClass">{{ credit.statusLabel }}</span>
        </div>
        <div class="flow-panel-pad flow-stack">
          <div class="mini-row"><span>RUC</span><strong>{{ client.ruc }}</strong></div>
          <div class="mini-row"><span>Segment</span><strong>{{ client.segment }}</strong></div>
          <div class="mini-row"><span>Orders</span><strong>{{ orders.length }}</strong></div>
          <div class="mini-row"><span>Documents</span><strong>{{ documents.length }}</strong></div>
          <div class="mini-row"><span>Buyer portal</span><strong>{{ form.portalAccess ? 'Enabled' : 'Disabled' }}</strong></div>
        </div>
      </section>

      <section class="flow-panel span-8">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">Editable profile</div>
            <div class="flow-subtitle">Changes persist to the client account used by Sales and Buyer Portal.</div>
          </div>
        </div>
        <form class="flow-panel-pad client-profile-form editable-card-form" @submit.prevent="save">
          <label><span>Business name</span><input v-model="form.businessName" /></label>
          <label><span>Trade name</span><input v-model="form.commercialName" /></label>
          <label><span>RUC</span><input v-model="form.ruc" inputmode="numeric" /></label>
          <label><span>Segment</span><input v-model="form.segment" /></label>
          <label><span>Contact</span><input v-model="form.contact" /></label>
          <label><span>Email</span><input v-model="form.contactEmail" type="email" /></label>
          <label><span>Phone</span><input v-model="form.phone" /></label>
          <label><span>Payment condition</span><select v-model="form.paymentCondition"><option value="credit_7">Credit 7 days</option><option value="credit_15">Credit 15 days</option><option value="credit_30">Credit 30 days</option><option value="cash">Cash</option></select></label>
          <label><span>Credit limit</span><input v-model.number="form.monthlyCreditLimit" type="number" min="0" /></label>
          <label><span>Credit used</span><input v-model.number="form.monthlyCreditUsed" type="number" min="0" /></label>
          <label><span>Credit status</span><select v-model="form.monthlyCreditStatus"><option value="ok">OK</option><option value="attention">Attention</option><option value="document_pending">Document pending</option><option value="blocked">Blocked</option></select></label>
          <label><span>Account status</span><select v-model="form.status"><option value="active">Active</option><option value="paused">Paused</option></select></label>
          <label class="span-full"><span>Delivery preference</span><input v-model="form.deliveryPreference" /></label>
          <label><span>District</span><input v-model="form.district" /></label>
          <label><span>Province</span><input v-model="form.province" /></label>
          <label class="span-full"><span>Delivery address</span><input v-model="form.address" /></label>
          <label class="span-full"><span>Delivery reference</span><textarea v-model="form.deliveryReference" rows="3"></textarea></label>
          <label class="portal-toggle span-full"><input v-model="form.portalAccess" type="checkbox" /> Buyer portal access enabled</label>
          <p v-if="saveError" class="banner banner-danger span-full">{{ saveError }}</p>
          <p v-if="saved" class="banner banner-success span-full">Client profile saved.</p>
          <button class="btn btn-primary span-full" type="submit" :disabled="saving"><i class="pi pi-save"></i> {{ saving ? 'Saving...' : 'Save client profile' }}</button>
        </form>
      </section>

      <section class="flow-panel span-6">
        <div class="flow-panel-head"><div><div class="flow-title">Recent orders</div><div class="flow-subtitle">Sales and logistics records for this account.</div></div></div>
        <div class="flow-panel-pad flow-stack">
          <div v-for="order in orders.slice(0, 5)" :key="order.id" class="mini-row">
            <span class="mono">{{ displayCode(order) }}</span>
            <strong>{{ orderStatusLabel(order.status) }}</strong>
          </div>
          <div v-if="!orders.length" class="empty-state compact">No orders linked to this client.</div>
        </div>
      </section>

      <section class="flow-panel span-6">
        <div class="flow-panel-head"><div><div class="flow-title">Documents</div><div class="flow-subtitle">Factura, guia and POD visibility for this account.</div></div></div>
        <div class="flow-panel-pad flow-stack">
          <div v-for="document in documents.slice(0, 5)" :key="document.id" class="mini-row">
            <span>{{ document.label || document.type }}</span>
            <strong>{{ documentStatusLabel(document.status) }}</strong>
          </div>
          <div v-if="!documents.length" class="empty-state compact">No business documents linked to this client.</div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.client-profile-grid { display:grid; grid-template-columns:repeat(12,minmax(0,1fr)); gap:16px; align-items:start; }
.span-4 { grid-column:span 4; }
.span-6 { grid-column:span 6; }
.span-8 { grid-column:span 8; }
.span-full { grid-column:1/-1; }
.client-profile-form { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:13px; }
.client-profile-form label { display:grid; gap:8px; color:#334155; font-size:12px; font-weight:800; }
.editable-card-form label { min-height:92px; padding:14px; border:1px solid #dbeafe; border-radius:8px; background:#fff; }
.editable-card-form label.span-full { min-height:auto; }
.client-profile-form input,.client-profile-form select,.client-profile-form textarea { width:100%; min-height:42px; border:1px solid #c7d7ec; border-radius:12px; padding:0 12px; box-sizing:border-box; color:#0f172a; background:#f8fbff; }
.client-profile-form input:focus,.client-profile-form select:focus,.client-profile-form textarea:focus { outline:none; border-color:#2563eb; background:#fff; }
.client-profile-form textarea { padding:10px 11px; resize:vertical; }
.portal-toggle { display:flex !important; align-items:center; gap:10px; }
.portal-toggle input { width:auto; min-height:auto; }
@media (max-width:980px){ .span-4,.span-6,.span-8 { grid-column:1/-1; } }
@media (max-width:720px){ .client-profile-form { grid-template-columns:1fr; } }
</style>
