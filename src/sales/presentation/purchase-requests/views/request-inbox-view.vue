<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useDataStore } from '@/app/application/stores/data.store';
import { usePurchaseRequestsStore } from '@/sales/application/purchase-requests/purchase-requests.store';
import {
  requestStatusLabel,
  requestStatusBadge,
  displayCode,
  recordTimestamp,
  formatCalendarDate,
  formatRecordDateTime,
  isRecordNew,
} from '@/shared/status';
import { formatAddress } from '@/shared/utils/address.utils';

const ds = useDataStore();
const purchaseRequestsStore = usePurchaseRequestsStore();
const router = useRouter();
const { t } = useI18n();
const readModelRequests = computed(() => purchaseRequestsStore.inbox.map(request => ({
  id: request.id,
  backendId: request.id,
  code: request.code,
  clientId: request.client?.id,
  clientName: request.client?.commercialName || request.client?.businessName || request.client?.code,
  status: request.status,
  priority: request.priority,
  createdAt: request.createdAt,
  requestedDeliveryDate: request.requestedDeliveryDate,
  comments: request.lastMessagePreview,
  lineCount: request.lineCount,
  commercialOwner: request.commercialOwner,
})));
const requests = computed(() => (readModelRequests.value.length ? readModelRequests.value : ds.D.purchaseRequests)
  .slice()
  .sort((a, b) => recordTimestamp(b) - recordTimestamp(a)));
const selectedRequest = ref(null);
const closedStatuses = ['approved', 'rejected', 'converted_to_order'];

function docsFor(request) {
  return ['factura_xml', 'factura_pdf', 'guia_pdf'];
}

function deliverySummary(request) {
  const address = formatAddress(request.deliveryAddress, request.deliveryDistrict, request.deliveryCity, request.deliveryProvince);
  return [address, request.deliveryReference].filter(Boolean).join(' · ') || t('portal.requests.deliveryPending');
}

function requestLines(request) {
  return ds.requestItemsFor(request.id).map(item => {
    const product = ds.productById(item.productId) || {};
    return {
      ...item,
      product,
      name: product.name || item.itemName || item.productId,
      imageUrl: product.imageUrl || '',
      sku: product.sku || item.productId,
      price: Number(product.price || item.price || 0),
      unit: product.unit || item.unit || 'UN',
    };
  });
}

function openDetails(request) {
  selectedRequest.value = request;
}

function canRespond(request) {
  return !closedStatuses.includes(request.status);
}

const clientLabel = (request) => request.clientName || ds.clientName(request.clientId);
const isNewRequest = (request) => isRecordNew(request.createdAt);

onMounted(() => {
  purchaseRequestsStore.loadSalesInbox().catch(() => {});
});
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">{{ t('nav.requests') }}</div>
        <div class="page-subtitle">{{ t('commercialDashboard.requestInboxSub') }}</div>
      </div>
    </div>

    <section class="scenario-card">
      <div class="scenario-icon"><i class="pi pi-inbox"></i></div>
      <div>
        <strong>{{ t('portal.requestDetail.progress') }}</strong>
        <p>{{ t('portal.requestDetail.progressSubtitle') }}</p>
      </div>
    </section>

    <div v-if="!requests.length" class="empty-state">
      <div class="empty-state-icon"><i class="pi pi-inbox"></i></div>
      <div class="empty-state-title">{{ t('portal.requests.emptyTitle') }}</div>
      <div class="empty-state-desc">{{ t('portal.requests.emptyDesc') }}</div>
    </div>

    <div v-else class="flow-stack">
      <article v-for="request in requests" :key="request.id" class="flow-panel flow-panel-pad">
        <div class="flow-row-between" style="align-items:flex-start">
          <div>
            <div class="flow-row" style="margin-bottom:6px">
              <span class="mono" style="font-weight:800;color:#1D4ED8">{{ displayCode(request) }}</span>
              <span v-if="isNewRequest(request)" class="badge badge-new">{{ t('common.new') }}</span>
              <span :class="'badge ' + requestStatusBadge(request.status)">{{ requestStatusLabel(request.status) }}</span>
            </div>
            <h2 style="margin:0">{{ clientLabel(request) }}</h2>
            <p class="muted-text">{{ request.comments }}</p>
          </div>
          <span :class="['badge', request.priority === 'urgent' ? 'badge-red' : 'badge-blue']">{{ request.priority === 'urgent' ? 'URGENT' : (request.priority || 'normal') }}</span>
        </div>
        <div class="divider" style="margin:12px 0"></div>
        <div class="flow-row" style="justify-content:space-between;gap:12px;flex-wrap:wrap">
          <span>{{ t('common.created') }}: <strong>{{ formatRecordDateTime(request.createdAt) }}</strong></span>
          <span>{{ t('common.requestedDelivery') }}: <strong>{{ formatCalendarDate(request.requestedDeliveryDate) }}</strong></span>
          <span>{{ t('common.items') }}: <strong>{{ ds.requestItemsFor(request.id).length }}</strong></span>
          <span>{{ t('common.destination') }}: <strong>{{ deliverySummary(request) }}</strong></span>
        </div>
        <div class="doc-chip-row">
          <span v-for="doc in docsFor(request)" :key="doc" class="badge badge-blue">{{ doc }}</span>
        </div>
        <div class="form-actions">
          <button v-if="canRespond(request)" class="btn btn-primary" type="button" @click="router.push('/ops/commercial/purchase-requests/' + request.id)">
            <i class="pi pi-comments"></i> {{ t('common.review') }}
          </button>
          <span v-else :class="'badge ' + requestStatusBadge(request.status)">{{ requestStatusLabel(request.status) }}</span>
          <button class="btn btn-secondary" type="button" @click="openDetails(request)">
            <i class="pi pi-eye"></i> {{ t('common.quickView') }}
          </button>
        </div>
      </article>
    </div>

    <transition name="fade">
      <div v-if="selectedRequest" class="request-modal-backdrop" role="dialog" aria-modal="true" @click.self="selectedRequest = null">
        <section class="request-detail-modal">
          <header class="request-detail-head">
            <div>
              <div class="mono request-detail-code">{{ displayCode(selectedRequest) }}</div>
              <h2>{{ ds.clientName(selectedRequest.clientId) }}</h2>
              <p>{{ selectedRequest.comments || deliverySummary(selectedRequest) }}</p>
            </div>
            <button class="btn btn-ghost btn-sm" type="button" @click="selectedRequest = null" :aria-label="t('common.close')">
              <i class="pi pi-times"></i>
            </button>
          </header>

          <div class="request-detail-meta">
            <div><span>{{ t('common.status') }}</span><strong>{{ requestStatusLabel(selectedRequest.status) }}</strong></div>
            <div><span>{{ t('common.created') }}</span><strong>{{ formatRecordDateTime(selectedRequest.createdAt) }}</strong></div>
            <div><span>{{ t('common.requestedDelivery') }}</span><strong>{{ formatCalendarDate(selectedRequest.requestedDeliveryDate) }}</strong></div>
            <div><span>{{ t('common.priority') }}</span><strong>{{ selectedRequest.priority || 'normal' }}</strong></div>
            <div><span>{{ t('common.documents') }}</span><strong>{{ docsFor(selectedRequest).length }}</strong></div>
          </div>

          <div class="request-product-grid">
            <article v-for="line in requestLines(selectedRequest)" :key="line.id || line.productId" class="request-product-card">
              <div class="request-product-image">
                <img v-if="line.imageUrl" :src="line.imageUrl" :alt="line.name" />
                <i v-else class="pi pi-box"></i>
              </div>
              <div>
                <strong>{{ line.name }}</strong>
                <span>{{ line.sku }}</span>
                <small>{{ line.quantity || line.qty }} {{ line.unit }} · S/ {{ line.price.toFixed(2) }}</small>
              </div>
            </article>
          </div>

          <div v-if="!requestLines(selectedRequest).length" class="empty-state compact-empty">
            <div class="empty-state-icon"><i class="pi pi-box"></i></div>
            <div class="empty-state-title">{{ t('portal.requestDetail.requestedProducts') }}</div>
            <div class="empty-state-desc">{{ t('common.noRecords') }}</div>
          </div>
        </section>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.scenario-card { display:flex; gap:14px; align-items:flex-start; margin:0 0 18px; padding:16px; border:1px solid #bfdbfe; border-radius:18px; background:linear-gradient(135deg,#eff6ff,#f8fafc); }
.scenario-icon { width:42px; height:42px; border-radius:14px; display:flex; align-items:center; justify-content:center; background:white; color:#1d4ed8; box-shadow:0 8px 18px rgba(37,99,235,.10); }
.scenario-card strong { display:block; color:#0f172a; margin-bottom:4px; }
.scenario-card p { margin:0; color:#475569; line-height:1.55; }
.action-form { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-bottom:18px; }
.action-form label { display:grid; gap:6px; color:#334155; font-size:12px; font-weight:700; }
.action-form input,.action-form select,.action-form textarea { width:100%; min-height:40px; border:1px solid #d7deea; border-radius:10px; padding:0 11px; box-sizing:border-box; }
.action-form textarea { padding:10px 11px; resize:vertical; }
.span-2 { grid-column:1/-1; }
.form-actions { display:flex; justify-content:flex-end; gap:10px; flex-wrap:wrap; margin-top:12px; }
.doc-chip-row { display:flex; flex-wrap:wrap; gap:6px; margin-top:12px; }
.badge-new { background:#dcfce7; color:#15803d; border:1px solid #86efac; text-transform:uppercase; letter-spacing:.04em; }
button:disabled { opacity:.45; cursor:not-allowed; }
.request-modal-backdrop { position:fixed; inset:0; z-index:1200; display:flex; align-items:center; justify-content:center; padding:24px; background:rgba(15,23,42,.46); }
.request-detail-modal { width:min(920px,100%); max-height:min(86vh,820px); overflow:auto; border-radius:22px; background:#fff; border:1px solid #dbe5f2; box-shadow:0 24px 60px rgba(15,23,42,.24); }
.request-detail-head { display:flex; justify-content:space-between; gap:18px; padding:24px; border-bottom:1px solid #e8eef7; }
.request-detail-head h2 { margin:6px 0; color:#0f172a; }
.request-detail-head p { margin:0; color:#64748b; }
.request-detail-code { color:#1d4ed8; font-weight:900; }
.request-detail-meta { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:12px; padding:20px 24px; }
.request-detail-meta div { border:1px solid #e8eef7; border-radius:14px; background:#f8fafc; padding:14px; }
.request-detail-meta span { display:block; color:#64748b; font-size:11px; font-weight:800; text-transform:uppercase; margin-bottom:5px; }
.request-product-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; padding:0 24px 24px; }
.request-product-card { display:grid; grid-template-columns:96px minmax(0,1fr); gap:14px; align-items:center; border:1px solid #e2e8f0; border-radius:16px; padding:12px; background:#fff; }
.request-product-image { width:96px; height:82px; display:flex; align-items:center; justify-content:center; border-radius:12px; background:#f8fafc; overflow:hidden; }
.request-product-image img { width:100%; height:100%; object-fit:contain; background:#fff; }
.request-product-image .pi { color:#94a3b8; font-size:28px; }
.request-product-card strong { display:block; color:#0f172a; line-height:1.25; }
.request-product-card span, .request-product-card small { display:block; color:#64748b; margin-top:4px; }
.compact-empty { margin:0 24px 24px; }
@media (max-width:720px){ .action-form { grid-template-columns:1fr; } .span-2 { grid-column:auto; } }
@media (max-width:720px){ .request-detail-meta,.request-product-grid { grid-template-columns:1fr; } .request-product-card { grid-template-columns:82px minmax(0,1fr); } }
</style>
