<script setup>
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useDataStore } from '@/app/application/stores/data.store';
import { documentStatusLabel, documentStatusBadge, displayCode, formatRecordDateTime, isRecordNew } from '@/shared/status';

const ds = useDataStore();
const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const D = ds.D;
const statusFilter = ref('all');
const typeFilter = ref('all');
const clientFilter = ref('all');
const showForm = ref(false);
const saving = ref(false);
const generatingKey = ref('');
const formError = ref('');
const form = reactive({
  type: 'factura_xml',
  clientId: '',
  orderId: '',
  source: 'internal',
  status: 'pending',
  fileName: '',
  notes: '',
});
const documentTypes = ['factura_xml', 'factura_pdf', 'guia_pdf'];
const documentSources = ['internal', 'buyer_portal', 'logistics_upload'];
const documentStatuses = ['pending', 'uploaded', 'ready', 'missing', 'accepted'];
const documentTemplates = [
  { titleKey: 'businessDocuments.types.factura_xml', type: 'factura_xml', status: 'pending', source: 'internal', notesKey: 'businessDocuments.templates.facturaXmlNotes' },
  { titleKey: 'businessDocuments.types.factura_pdf', type: 'factura_pdf', status: 'pending', source: 'internal', notesKey: 'businessDocuments.templates.facturaPdfNotes' },
  { titleKey: 'businessDocuments.types.guia_pdf', type: 'guia_pdf', status: 'pending', source: 'logistics_upload', notesKey: 'businessDocuments.templates.guiaPdfNotes' },
];
const requiredDocumentTypes = ['factura_xml', 'factura_pdf', 'guia_pdf'];

const pendingCount = computed(() => D.businessDocuments.filter(document => document.status === 'pending').length);
const reviewCount = computed(() => D.businessDocuments.filter(document => ['uploaded', 'ready'].includes(document.status)).length);
const linkedCount = computed(() => D.businessDocuments.filter(document => document.orderId).length);
const missingCount = computed(() => D.businessDocuments.filter(document => ['missing', 'pending'].includes(document.status)).length);
const orderDocumentCards = computed(() => {
  let orders = D.purchaseOrders || [];
  if (clientFilter.value !== 'all') orders = orders.filter(order => order.clientId === clientFilter.value);
  return orders.map(order => {
    const docs = D.businessDocuments.filter(document => document.orderId === order.id);
    const required = requiredDocumentTypes.map(type => {
      const document = docs.find(row => row.type === type);
      return {
        type,
        document,
        status: document?.status || 'missing',
      };
    });
    return {
      order,
      docs,
      required,
      readyCount: required.filter(item => ['ready', 'uploaded', 'accepted'].includes(item.status)).length,
      missingCount: required.filter(item => ['missing', 'pending'].includes(item.status)).length,
    };
  });
});

function typeLabel(type) {
  return {
    factura_xml: t('businessDocuments.types.factura_xml'),
    factura_pdf: t('businessDocuments.types.factura_pdf'),
    guia_pdf: t('businessDocuments.types.guia_pdf'),
  }[type] || type;
}

function sourceLabel(source) {
  return {
    internal: t('businessDocuments.sources.internal'),
    buyer_portal: t('businessDocuments.sources.buyer_portal'),
    logistics_upload: t('businessDocuments.sources.logistics_upload'),
    'nexa-platform': t('businessDocuments.sources.nexaPlatform'),
  }[source] || source || t('businessDocuments.sources.internal');
}

function resetForm() {
  const firstOrder = D.purchaseOrders[0] || null;
  Object.assign(form, {
    type: 'factura_xml',
    clientId: firstOrder?.clientId || D.clients[0]?.id || '',
    orderId: firstOrder?.id || '',
    source: 'internal',
    status: 'pending',
    fileName: '',
    notes: '',
  });
  formError.value = '';
}

function openForm() {
  resetForm();
  showForm.value = true;
}

async function save() {
  if (!form.orderId || !form.clientId) {
    formError.value = t('businessDocuments.errors.selectOrderClient');
    return;
  }
  saving.value = true;
  formError.value = '';
  try {
    await ds.addBusinessDocument({
      ...form,
      label: typeLabel(form.type),
    });
    showForm.value = false;
    resetForm();
  } catch (error) {
    formError.value = error?.message || t('businessDocuments.errors.save');
  } finally {
    saving.value = false;
  }
}

function applyDocumentTemplate(flow) {
  form.type = flow.type;
  form.status = flow.status;
  form.source = flow.source;
  form.notes = t(flow.notesKey);
  form.fileName = `${flow.type.replaceAll('_', '-')}.${flow.type === 'factura_xml' ? 'xml' : 'pdf'}`;
}

function openDocumentForOrder(order, type) {
  Object.assign(form, {
    type,
    clientId: order.clientId,
    orderId: order.id,
    source: type === 'guia_pdf' ? 'logistics_upload' : 'internal',
    status: 'pending',
    fileName: `${displayCode(order).toLowerCase()}-${type.replaceAll('_', '-')}.${type === 'factura_xml' ? 'xml' : 'pdf'}`,
    notes: '',
  });
  formError.value = '';
  showForm.value = true;
}

async function generateDocumentForOrder(order, type) {
  const key = `${order.id}-${type}`;
  generatingKey.value = key;
  formError.value = '';
  try {
    await ds.generateBusinessDocument({ orderId: order.id, type });
  } catch (error) {
    formError.value = error?.message || t('businessDocuments.errors.generate');
  } finally {
    generatingKey.value = '';
  }
}

function openOrderDocuments(order) {
  const scope = route.path.includes('/operations/') ? 'operations' : 'commercial';
  router.push(`/ops/${scope}/business-documents/orders/${order.id}`);
}

function generationLabel(type) {
  return {
    factura_xml: t('businessDocuments.actions.generateXml'),
    factura_pdf: t('businessDocuments.actions.generateFacturaPdf'),
    guia_pdf: t('businessDocuments.actions.generateGuiaPdf'),
  }[type] || t('businessDocuments.actions.generateType', { type: typeLabel(type) });
}

function generationIcon(type) {
  return type === 'factura_xml' ? 'pi-code' : 'pi-file-pdf';
}

function isNewRecord(record) {
  return isRecordNew(record?.createdAt);
}

function isNewDocumentCard(card) {
  return isNewRecord(card.order) || card.docs.some(document => isNewRecord(document));
}

function recordDateLabel(record) {
  return formatRecordDateTime(record?.createdAt || record?.date || record?.updatedAt, locale.value);
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">{{ t('businessDocuments.title') }}</div>
        <div class="page-subtitle">{{ t('businessDocuments.subtitle') }}</div>
      </div>
      <button class="btn btn-primary" type="button" @click="openForm"><i class="pi pi-plus"></i> {{ t('businessDocuments.addDocument') }}</button>
    </div>

    <section v-if="showForm" class="document-builder-screen">
      <div class="builder-topbar">
        <button class="btn btn-secondary" type="button" @click="showForm = false; resetForm()"><i class="pi pi-arrow-left"></i> {{ t('businessDocuments.documentCenter') }}</button>
        <div>
          <strong>{{ t('businessDocuments.newDocument') }}</strong>
          <span>{{ t('businessDocuments.newDocumentDesc') }}</span>
        </div>
      </div>

      <div class="document-layout">
        <aside class="document-template-panel">
          <div class="catalog-heading">
            <span>{{ t('businessDocuments.documentTemplates') }}</span>
            <strong>{{ t('businessDocuments.ordersCount', { count: D.purchaseOrders.length }) }}</strong>
          </div>
          <button v-for="flow in documentTemplates" :key="flow.type" type="button" @click="applyDocumentTemplate(flow)">
            <strong>{{ t(flow.titleKey) }}</strong>
            <small>{{ typeLabel(flow.type) }} · {{ documentStatusLabel(flow.status) }}</small>
            <span>{{ t(flow.notesKey) }}</span>
          </button>
          <div class="linked-products">
            <span>{{ t('businessDocuments.linkedOrders') }}</span>
            <small v-for="order in D.purchaseOrders.slice(0, 4)" :key="order.id">{{ displayCode(order) }} · {{ ds.clientName(order.clientId) }}</small>
            <small v-if="!D.purchaseOrders.length">{{ t('businessDocuments.noOrdersYet') }}</small>
          </div>
        </aside>

        <form class="flow-panel flow-panel-pad action-form" @submit.prevent="save">
          <div class="editor-heading span-2">
            <strong>{{ t('businessDocuments.documentDetails') }}</strong>
            <span>{{ t('businessDocuments.documentDetailsDesc') }}</span>
          </div>
          <label>{{ t('businessDocuments.form.type') }}<select v-model="form.type"><option v-for="type in documentTypes" :key="type" :value="type">{{ typeLabel(type) }}</option></select></label>
          <label>{{ t('businessDocuments.form.client') }}<select v-model="form.clientId"><option v-for="client in D.clients" :key="client.id" :value="client.id">{{ client.commercialName || client.businessName }}</option></select></label>
          <label class="span-2">{{ t('businessDocuments.form.relatedOrder') }}<select v-model="form.orderId"><option value="" disabled>{{ t('businessDocuments.form.selectRealOrder') }}</option><option v-for="order in D.purchaseOrders" :key="order.id" :value="order.id">{{ displayCode(order) }} · {{ ds.clientName(order.clientId) }}</option></select></label>
          <label>{{ t('businessDocuments.form.source') }}<select v-model="form.source"><option v-for="source in documentSources" :key="source" :value="source">{{ sourceLabel(source) }}</option></select></label>
          <label>{{ t('portal.table.status') }}<select v-model="form.status"><option v-for="status in documentStatuses" :key="status" :value="status">{{ documentStatusLabel(status) }}</option></select></label>
          <label class="span-2">{{ t('businessDocuments.form.fileReference') }}<input v-model="form.fileName" placeholder="dispatch-guide.pdf" /></label>
          <label class="span-2">{{ t('businessDocuments.form.notes') }}<textarea v-model="form.notes" rows="2" :placeholder="t('businessDocuments.form.notesPlaceholder')"></textarea></label>
          <div v-if="formError" class="banner banner-danger span-2"><i class="pi pi-exclamation-triangle"></i><div>{{ formError }}</div></div>
          <div class="form-actions span-2">
            <button class="btn btn-secondary" type="button" @click="showForm = false; resetForm()">{{ t('common.cancel') }}</button>
            <button class="btn btn-primary" type="submit" :disabled="saving || !form.orderId || !form.clientId">{{ saving ? t('common.saving') : t('businessDocuments.saveDocument') }}</button>
          </div>
        </form>
      </div>
    </section>

    <template v-else>
      <section class="scenario-card">
        <div class="scenario-icon"><i class="pi pi-file-check"></i></div>
        <div>
          <strong>{{ t('businessDocuments.readinessTitle') }}</strong>
          <p>{{ t('businessDocuments.readinessDesc') }}</p>
        </div>
      </section>

      <div class="grid-4" style="margin-bottom:18px">
        <div class="card kpi-card">
          <div class="kpi-label"><i class="pi pi-clock" style="color:#F59E0B"></i> {{ t('common.pending') }}</div>
          <div class="kpi-value" style="color:#F59E0B">{{ pendingCount }}</div>
          <div class="kpi-sub">{{ t('businessDocuments.kpi.pendingSub') }}</div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-label"><i class="pi pi-search" style="color:#F97316"></i> {{ t('businessDocuments.kpi.review') }}</div>
          <div class="kpi-value" style="color:#F97316">{{ reviewCount }}</div>
          <div class="kpi-sub">{{ t('businessDocuments.kpi.reviewSub') }}</div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-label"><i class="pi pi-truck" style="color:#2563EB"></i> {{ t('businessDocuments.kpi.linked') }}</div>
          <div class="kpi-value" style="color:#2563EB">{{ linkedCount }}</div>
          <div class="kpi-sub">{{ t('businessDocuments.kpi.linkedSub') }}</div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-label"><i class="pi pi-exclamation-triangle" style="color:#B91C1C"></i> {{ t('businessDocuments.kpi.missing') }}</div>
          <div class="kpi-value" style="color:#B91C1C">{{ missingCount }}</div>
          <div class="kpi-sub">{{ t('businessDocuments.kpi.missingSub') }}</div>
        </div>
      </div>

      <div class="filter-bar">
        <button v-for="status in ['all', 'pending', 'uploaded', 'ready', 'missing', 'accepted']" :key="status" class="filter-chip" :class="{ active: statusFilter === status }" @click="statusFilter = status">
          {{ status === 'all' ? t('businessDocuments.filters.allStatuses') : documentStatusLabel(status) }}
        </button>
        <select v-model="typeFilter" class="compact-filter"><option value="all">{{ t('businessDocuments.filters.allTypes') }}</option><option v-for="type in documentTypes" :key="type" :value="type">{{ typeLabel(type) }}</option></select>
        <select v-model="clientFilter" class="compact-filter"><option value="all">{{ t('businessDocuments.filters.allClients') }}</option><option v-for="client in D.clients" :key="client.id" :value="client.id">{{ client.commercialName || client.businessName }}</option></select>
      </div>

      <section class="order-document-grid">
        <article v-for="card in orderDocumentCards" :key="card.order.id" class="flow-panel flow-panel-pad order-document-card">
          <div class="flow-row-between" style="align-items:flex-start">
            <div>
              <div class="document-card-title-row">
                <div class="mono order-code">{{ displayCode(card.order) }}</div>
                <span v-if="isNewDocumentCard(card)" class="badge-new">{{ t('common.new') }}</span>
              </div>
              <h2>{{ ds.clientName(card.order.clientId) }}</h2>
              <p class="muted-text">{{ t('businessDocuments.requiredBeforeDispatch') }} · {{ recordDateLabel(card.order) }}</p>
            </div>
            <span :class="['badge', card.missingCount ? 'badge-amber' : 'badge-green']">
              {{ t('businessDocuments.readyCount', { ready: card.readyCount, total: requiredDocumentTypes.length }) }}
            </span>
          </div>
          <div class="document-checklist">
            <div v-for="item in card.required" :key="item.type" class="document-check-row">
              <span>
                <strong>{{ typeLabel(item.type) }}</strong>
                <small>{{ item.document?.fileName || t('businessDocuments.pendingFileReference') }}</small>
              </span>
              <span :class="'badge ' + documentStatusBadge(item.status)">{{ documentStatusLabel(item.status) }}</span>
              <button
                class="btn btn-secondary btn-sm document-action-button"
                type="button"
                :disabled="generatingKey === `${card.order.id}-${item.type}`"
                @click="generateDocumentForOrder(card.order, item.type)"
              >
                <i :class="'pi ' + generationIcon(item.type)"></i>
                {{ item.document ? t('businessDocuments.actions.regenerate') : generationLabel(item.type) }}
              </button>
            </div>
          </div>
          <button class="btn btn-primary order-detail-button" type="button" @click="openOrderDocuments(card.order)">
            <i class="pi pi-folder-open"></i> {{ t('businessDocuments.viewDetails') }}
          </button>
        </article>
        <div v-if="!orderDocumentCards.length" class="empty-state compact">
          <div class="empty-state-icon"><i class="pi pi-shopping-cart"></i></div>
          <div class="empty-state-title">{{ t('businessDocuments.noOrdersTitle') }}</div>
          <div class="empty-state-desc">{{ t('businessDocuments.noOrdersDesc') }}</div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.scenario-card { display:flex; gap:14px; align-items:flex-start; margin:0 0 18px; padding:16px; border:1px solid #bfdbfe; border-radius:8px; background:#eff6ff; }
.scenario-icon { width:42px; height:42px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:white; color:#1d4ed8; }
.scenario-card strong { display:block; color:#0f172a; margin-bottom:4px; }
.scenario-card p { margin:0; color:#475569; line-height:1.55; }
.document-builder-screen { display:grid; gap:16px; }
.builder-topbar { display:flex; align-items:center; gap:14px; padding:14px; border:1px solid #bfdbfe; border-radius:8px; background:#eef6ff; }
.builder-topbar > div { display:grid; gap:3px; }
.builder-topbar strong { color:#0f172a; font-size:15px; }
.builder-topbar span { color:#64748b; font-size:13px; line-height:1.4; }
.document-layout { display:grid; grid-template-columns:minmax(260px,340px) minmax(0,1fr); gap:16px; align-items:start; }
.document-template-panel { display:grid; gap:8px; padding:14px; border:1px solid #d7deea; border-radius:8px; background:#fff; }
.catalog-heading { display:flex; justify-content:space-between; gap:10px; align-items:center; padding-bottom:6px; color:#64748b; font-size:12px; font-weight:800; }
.catalog-heading strong { color:#1d4ed8; }
.document-template-panel button { display:grid; gap:4px; width:100%; min-height:82px; border:1px solid #e2e8f0; border-radius:8px; background:#fff; color:#334155; padding:11px 12px; text-align:left; cursor:pointer; }
.document-template-panel button:hover { border-color:#93c5fd; background:#eff6ff; }
.document-template-panel strong { color:#0f172a; font-size:13px; line-height:1.25; }
.document-template-panel small,.document-template-panel span { color:#64748b; font-size:11px; line-height:1.35; }
.linked-products { display:grid; gap:5px; margin-top:6px; padding:10px; border-radius:8px; background:#f8fafc; color:#64748b; font-size:11px; }
.order-document-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; margin-bottom:18px; align-items:start; }
.order-document-card h2 { margin:4px 0 2px; color:#0f172a; font-size:18px; }
.document-card-title-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.order-code { color:#1d4ed8; font-weight:900; font-size:13px; }
.badge-new { display:inline-flex; align-items:center; width:max-content; min-height:20px; padding:2px 8px; border:1px solid #93c5fd; border-radius:999px; background:#dbeafe; color:#1d4ed8; font-size:10px; font-weight:900; text-transform:uppercase; }
.document-checklist { display:grid; gap:10px; margin-top:14px; }
.order-detail-button { width:100%; justify-content:center; margin-top:12px; }
.document-check-row { display:grid; grid-template-columns:minmax(0,1fr) auto auto; gap:10px; align-items:center; padding:10px 0; border-top:1px solid #e2e8f0; }
.document-check-row span:first-child { display:grid; gap:3px; min-width:0; }
.document-check-row strong { color:#0f172a; font-size:13px; }
.document-check-row small { color:#64748b; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.document-action-button { min-width:168px; justify-content:center; }
.linked-products span { color:#334155; font-weight:900; }
.action-form { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-bottom:18px; border-color:#bfdbfe; box-shadow:0 14px 32px rgba(15,23,42,.08); }
.editor-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:12px; padding-bottom:4px; border-bottom:1px solid #dbeafe; }
.editor-heading strong { color:#0f172a; font-size:14px; }
.editor-heading span { color:#64748b; font-size:12px; }
.action-form label { display:grid; gap:6px; color:#334155; font-size:12px; font-weight:800; }
.action-form input,.action-form select,.action-form textarea,.compact-filter { width:100%; min-height:40px; border:1px solid #d7deea; border-radius:10px; padding:0 11px; background:#fff; color:#0f172a; }
.action-form textarea { padding:10px 11px; resize:vertical; }
.span-2 { grid-column:1/-1; }
.form-actions,.row-actions { display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; }
.compact-filter { width:auto; min-width:180px; font-size:12px; font-weight:800; }
@media (max-width:980px){ .document-layout,.order-document-grid { grid-template-columns:1fr; } }
@media (max-width:720px){ .action-form { grid-template-columns:1fr; } .span-2 { grid-column:auto; } .compact-filter { width:100%; } .builder-topbar { align-items:flex-start; flex-direction:column; } .document-check-row { grid-template-columns:1fr; } .document-action-button { width:100%; } }
</style>
