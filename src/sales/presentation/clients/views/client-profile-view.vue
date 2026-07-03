<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useDataStore } from '@/app/application/stores/data.store';
import { creditSummary } from '@/shared/credit';
import { displayCode, orderStatusLabel, documentStatusLabel } from '@/shared/status';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const ds = useDataStore();
const saving = ref(false);
const saveError = ref('');
const saved = ref(false);
const editing = ref(false);

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

function cancelEdit() {
  syncForm(client.value);
  editing.value = false;
}

async function save() {
  if (!client.value) return;
  saving.value = true;
  saveError.value = '';
  saved.value = false;
  try {
    await ds.updateClient(client.value.id, { ...form });
    saved.value = true;
    editing.value = false;
  } catch (error) {
    saveError.value = error?.response?.data?.message || error?.message || t('clients.profile.saveError');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div v-if="!client" class="empty-state">
    <div class="empty-state-icon"><i class="pi pi-building"></i></div>
    <div class="empty-state-title">{{ t('clients.profile.notFound') }}</div>
    <div class="empty-state-desc">{{ t('clients.profile.notFoundDesc') }}</div>
    <button class="btn btn-primary" type="button" @click="router.push('/ops/commercial/client-accounts')">{{ t('clients.profile.back') }}</button>
  </div>

  <div v-else>
    <div class="page-header">
      <div>
        <div class="page-title">{{ client.commercialName || client.businessName }}</div>
        <div class="page-subtitle">{{ t('clients.profile.subtitle') }}</div>
      </div>
      <button class="btn btn-secondary" type="button" @click="router.push('/ops/commercial/client-accounts')">
        <i class="pi pi-arrow-left"></i> {{ t('clients.profile.accounts') }}
      </button>
    </div>

    <div class="client-profile-grid">
      <section class="flow-panel span-4">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">{{ t('clients.profile.summary') }}</div>
            <div class="flow-subtitle">{{ t('clients.profile.summaryDesc') }}</div>
          </div>
          <span :class="'badge ' + credit.badgeClass">{{ credit.statusLabel }}</span>
        </div>
        <div class="flow-panel-pad flow-stack">
          <div class="mini-row"><span>RUC</span><strong>{{ client.ruc }}</strong></div>
          <div class="mini-row"><span>{{ t('clients.view.fields.segment') }}</span><strong>{{ client.segment }}</strong></div>
          <div class="mini-row"><span>{{ t('nav.orders') }}</span><strong>{{ orders.length }}</strong></div>
          <div class="mini-row"><span>{{ t('nav.documents') }}</span><strong>{{ documents.length }}</strong></div>
          <div class="mini-row"><span>{{ t('clients.profile.buyerPortal') }}</span><strong>{{ form.portalAccess ? t('common.enabled') : t('common.disabled') }}</strong></div>
        </div>
      </section>

      <section class="flow-panel span-8" :class="{ editing }">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">{{ t('clients.profile.editable') }}</div>
            <div class="flow-subtitle">{{ t('clients.profile.editableDesc') }}</div>
          </div>
          <button v-if="!editing" class="btn btn-secondary" type="button" @click="editing = true">{{ t('clients.profile.edit') }}</button>
        </div>
        <form class="flow-panel-pad client-profile-form editable-card-form" @submit.prevent="save">
          <label><span>{{ t('clients.view.fields.legalName') }}</span><input v-model="form.businessName" :disabled="!editing" /></label>
          <label><span>{{ t('clients.view.fields.tradeName') }}</span><input v-model="form.commercialName" :disabled="!editing" /></label>
          <label><span>RUC</span><input v-model="form.ruc" inputmode="numeric" :disabled="!editing" /></label>
          <label><span>{{ t('clients.view.fields.segment') }}</span><input v-model="form.segment" :disabled="!editing" /></label>
          <label><span>{{ t('clients.view.fields.contactName') }}</span><input v-model="form.contact" :disabled="!editing" /></label>
          <label><span>{{ t('clients.view.fields.contactEmail') }}</span><input v-model="form.contactEmail" type="email" :disabled="!editing" /></label>
          <label><span>{{ t('clients.view.fields.phone') }}</span><input v-model="form.phone" :disabled="!editing" /></label>
          <label><span>{{ t('clients.view.fields.creditCondition') }}</span><select v-model="form.paymentCondition" :disabled="!editing"><option value="credit_7">{{ t('clients.profile.credit7') }}</option><option value="credit_15">{{ t('clients.view.payment.credit15') }}</option><option value="credit_30">{{ t('clients.view.payment.credit30') }}</option><option value="cash">{{ t('clients.cash') }}</option></select></label>
          <label><span>{{ t('clients.view.fields.creditLimit') }}</span><input v-model.number="form.monthlyCreditLimit" type="number" min="0" :disabled="!editing" /></label>
          <label><span>{{ t('clients.profile.creditUsed') }}</span><input v-model.number="form.monthlyCreditUsed" type="number" min="0" :disabled="!editing" /></label>
          <label><span>{{ t('clients.profile.creditStatus') }}</span><select v-model="form.monthlyCreditStatus" :disabled="!editing"><option value="ok">OK</option><option value="attention">{{ t('clients.view.readiness.attention') }}</option><option value="document_pending">{{ t('clients.view.readiness.documentPending') }}</option><option value="blocked">{{ t('clients.view.readiness.blocked') }}</option></select></label>
          <label><span>{{ t('clients.profile.accountStatus') }}</span><select v-model="form.status" :disabled="!editing"><option value="active">{{ t('clients.active') }}</option><option value="paused">{{ t('clients.profile.paused') }}</option></select></label>
          <label class="span-full"><span>{{ t('clients.profile.deliveryPreference') }}</span><input v-model="form.deliveryPreference" :disabled="!editing" /></label>
          <label><span>{{ t('clients.profile.district') }}</span><input v-model="form.district" :disabled="!editing" /></label>
          <label><span>{{ t('clients.profile.province') }}</span><input v-model="form.province" :disabled="!editing" /></label>
          <label class="span-full"><span>{{ t('clients.profile.deliveryAddress') }}</span><input v-model="form.address" :disabled="!editing" /></label>
          <label class="span-full"><span>{{ t('clients.profile.deliveryReference') }}</span><textarea v-model="form.deliveryReference" rows="3" :disabled="!editing"></textarea></label>
          <label class="portal-toggle span-full"><input v-model="form.portalAccess" type="checkbox" :disabled="!editing" /> {{ t('clients.profile.portalEnabled') }}</label>
          <p v-if="saveError" class="banner banner-danger span-full">{{ saveError }}</p>
          <p v-if="saved" class="banner banner-success span-full">{{ t('clients.profile.saved') }}</p>
          <div v-if="editing" class="profile-form-actions span-full">
            <button class="btn btn-secondary" type="button" @click="cancelEdit">{{ t('common.cancel') }}</button>
            <button class="btn btn-primary" type="submit" :disabled="saving"><i class="pi pi-save"></i> {{ saving ? t('common.saving') : t('clients.profile.save') }}</button>
          </div>
        </form>
      </section>

      <section class="flow-panel span-6">
        <div class="flow-panel-head"><div><div class="flow-title">{{ t('clients.profile.recentOrders') }}</div><div class="flow-subtitle">{{ t('clients.profile.recentOrdersDesc') }}</div></div></div>
        <div class="flow-panel-pad flow-stack">
          <div v-for="order in orders.slice(0, 5)" :key="order.id" class="mini-row">
            <span class="mono">{{ displayCode(order) }}</span>
            <strong>{{ orderStatusLabel(order.status) }}</strong>
          </div>
          <div v-if="!orders.length" class="empty-state compact">{{ t('clients.profile.noOrders') }}</div>
        </div>
      </section>

      <section class="flow-panel span-6">
        <div class="flow-panel-head"><div><div class="flow-title">{{ t('nav.documents') }}</div><div class="flow-subtitle">{{ t('clients.profile.documentsDesc') }}</div></div></div>
        <div class="flow-panel-pad flow-stack">
          <div v-for="document in documents.slice(0, 5)" :key="document.id" class="mini-row">
            <span>{{ document.label || document.type }}</span>
            <strong>{{ documentStatusLabel(document.status) }}</strong>
          </div>
          <div v-if="!documents.length" class="empty-state compact">{{ t('clients.profile.noDocuments') }}</div>
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
@media (max-width:980px){ .span-4,.span-6,.span-8 { grid-column:1/-1; } }
@media (max-width:720px){ .client-profile-form { grid-template-columns:1fr; } }
</style>
