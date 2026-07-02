<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useDataStore } from '@/app/application/stores/data.store';
import {
  requestStatusLabel,
  requestStatusBadge,
  paymentMethodLabel,
  displayCode,
  formatCalendarDate,
  formatRecordDateTime,
} from '@/shared/status';
import { creditSummary } from '@/shared/credit';
import { formatAddress } from '@/shared/utils/address.utils';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const ds = useDataStore();
const request = computed(() => ds.purchaseRequestById(route.params.id));
const client = computed(() => request.value ? ds.clientById(request.value.clientId) || {} : {});
const credit = computed(() => creditSummary(client.value));
const items = computed(() => request.value ? ds.requestItemsFor(request.value.id).map(item => {
  const product = ds.productById(item.productId) || {};
  const quantity = Number(item.quantity || item.qty || 0);
  const price = Number(item.price || product.price || 0);
  return {
    ...item,
    product,
    name: product.name || item.itemName || item.productId,
    imageUrl: product.imageUrl || '',
    sku: product.sku || item.productId,
    unit: product.unit || item.unit || 'UN',
    quantity,
    price,
    subtotal: Number(item.subtotal || item.lineTotal || quantity * price || 0),
  };
}) : []);
const messages = computed(() => request.value ? ds.messagesForRequest(request.value.id).filter(message => message.visibleToBuyer !== false) : []);
const total = computed(() => items.value.reduce((sum, item) => sum + item.subtotal, 0));
const convertedOrder = computed(() => request.value?.convertedOrderId ? ds.purchaseOrderById(request.value.convertedOrderId) : null);
const requiredDocs = computed(() => {
  const profile = request.value?.documentProfile || client.value?.documentProfile || 'standard_docs';
  return profile === 'minimal_docs'
    ? ['Factura PDF', 'Guia de remision PDF']
    : ['Factura XML', 'Factura PDF', 'Guia de remision PDF'];
});

const decisionSteps = computed(() => {
  const status = request.value?.status || 'pending';
  const orderCreated = Boolean(convertedOrder.value || status === 'converted_to_order');
  return [
    { label: t('portal.requestDetail.steps.sent'), state: 'done' },
    { label: t('portal.requestDetail.steps.salesValidation'), state: ['submitted', 'in_review', 'needs_adjustment', 'approved', 'converted_to_order'].includes(status) ? (['approved', 'converted_to_order'].includes(status) ? 'done' : 'active') : 'pending' },
    { label: t('portal.requestDetail.steps.buyerAdjustment'), state: status === 'needs_adjustment' ? 'active' : ['approved', 'converted_to_order'].includes(status) ? 'done' : 'pending' },
    { label: t('portal.requestDetail.steps.purchaseOrder'), state: orderCreated ? 'done' : status === 'approved' ? 'active' : 'pending' },
  ];
});

function deliveryText(requestRecord) {
  return formatAddress(
    requestRecord.deliveryAddress,
    requestRecord.deliveryDistrict,
    requestRecord.deliveryCity,
    requestRecord.deliveryProvince,
  ) || requestRecord.deliveryAddressId || t('portal.requests.deliveryPending');
}

function paymentLabel() {
  return paymentMethodLabel(request.value?.paymentOption || client.value?.paymentCondition || '') || t('common.toConfirm');
}
</script>

<template>
  <div v-if="!request" class="empty-state">
    <div class="empty-state-icon"><i class="pi pi-file"></i></div>
    <div class="empty-state-title">{{ t('portal.requestDetail.notFound') }}</div>
    <button class="btn btn-primary" @click="router.push('/portal/purchase-requests')">{{ t('portal.backToRequests') }}</button>
  </div>

  <div v-else>
    <div class="page-header">
      <div>
        <div class="page-title">{{ displayCode(request) }}</div>
        <div class="page-subtitle">{{ t('portal.requestDetail.subtitle') }}</div>
      </div>
      <div class="flow-row">
        <button class="btn btn-ghost btn-sm" type="button" @click="router.push('/portal/purchase-requests')">
          <i class="pi pi-arrow-left"></i> {{ t('portal.backToRequests') }}
        </button>
        <button
          v-if="convertedOrder"
          class="btn btn-secondary btn-sm"
          type="button"
          @click="router.push('/portal/purchase-orders/' + convertedOrder.id)"
        >
          <i class="pi pi-truck"></i> {{ t('portal.requestDetail.viewOrder') }}
        </button>
        <span :class="'badge ' + requestStatusBadge(request.status)">{{ requestStatusLabel(request.status) }}</span>
      </div>
    </div>

    <div class="flow-grid-12">
      <section class="flow-panel span-7">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">{{ t('portal.requestDetail.requestedProducts') }}</div>
            <div class="flow-subtitle">{{ t('portal.requestDetail.itemsSubtitle', { count: items.length, total: total.toFixed(2) }) }}</div>
          </div>
        </div>
        <div class="flow-panel-pad flow-stack">
          <article class="buyer-note">
            <strong>{{ t('portal.requestDetail.buyerSpecifications') }}</strong>
            <p>{{ request.comments || t('portal.requests.noSpecifications') }}</p>
          </article>

          <div class="request-product-grid">
            <article v-for="item in items" :key="item.id || item.productId" class="request-product-card">
              <div class="request-product-image">
                <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" />
                <i v-else class="pi pi-box"></i>
              </div>
              <div>
                <strong>{{ item.name }}</strong>
                <span>{{ item.sku }}</span>
                <small>{{ item.quantity }} {{ item.unit }} · S/ {{ item.price.toFixed(2) }} · subtotal S/ {{ item.subtotal.toFixed(2) }}</small>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="flow-panel span-5">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">{{ t('portal.requestDetail.details') }}</div>
            <div class="flow-subtitle">{{ request.comments }}</div>
          </div>
        </div>
        <div class="flow-panel-pad flow-stack">
          <div class="request-detail-meta">
            <div><span>{{ t('portal.homePanel.credit') }}</span><strong :class="'badge ' + credit.badgeClass">{{ credit.statusLabel }}</strong></div>
            <div><span>{{ t('common.available') }}</span><strong>S/ {{ credit.available.toLocaleString('en-US') }}</strong></div>
            <div><span>{{ t('common.created') }}</span><strong>{{ formatRecordDateTime(request.createdAt) }}</strong></div>
            <div><span>{{ t('common.requestedDelivery') }}</span><strong>{{ formatCalendarDate(request.requestedDeliveryDate) }}</strong></div>
            <div><span>{{ t('common.payment') }}</span><strong>{{ paymentLabel() }}</strong></div>
            <div><span>{{ t('common.lastUpdate') }}</span><strong>{{ formatRecordDateTime(request.updatedAt || request.createdAt) }}</strong></div>
          </div>
          <div class="mini-row"><span>{{ t('common.address') }}</span><strong>{{ deliveryText(request) }}</strong></div>
          <div class="mini-row"><span>{{ t('common.reference') }}</span><strong>{{ request.deliveryReference || t('portal.requestDetail.noReference') }}</strong></div>
          <div class="doc-chip-row">
            <span v-for="doc in requiredDocs" :key="doc" class="badge badge-blue">{{ doc }}</span>
          </div>
        </div>
      </section>

      <section class="flow-panel span-12">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">{{ t('portal.requestDetail.progress') }}</div>
            <div class="flow-subtitle">{{ t('portal.requestDetail.progressSubtitle') }}</div>
          </div>
        </div>
        <div class="flow-panel-pad">
          <div class="flow-timeline-horizontal">
            <div
              v-for="step in decisionSteps"
              :key="step.label"
              :class="'timeline-step ' + step.state"
            >
              <div class="timeline-dot"></div>
              <div class="timeline-label">{{ step.label }}</div>
            </div>
          </div>
        </div>
      </section>

      <section class="flow-panel span-12">
        <div class="flow-panel-head">
          <div class="flow-title">{{ t('portal.requestDetail.conversation') }}</div>
        </div>
        <div class="flow-panel-pad flow-stack">
          <div v-for="message in messages" :key="message.id" class="message-row">
            <div>
              <strong>{{ message.senderName }}</strong>
              <span>{{ message.senderRole }}</span>
            </div>
            <p>{{ message.body }}</p>
          </div>
          <div v-if="!messages.length" class="empty-state compact">
            <div class="empty-state-title">{{ t('portal.requestDetail.noMessages') }}</div>
            <div class="empty-state-desc">{{ t('portal.requestDetail.noMessagesDesc') }}</div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.request-detail-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.request-detail-meta div {
  border: 1px solid #e8eef7;
  border-radius: 8px;
  background: #f8fafc;
  padding: 14px;
}
.request-detail-meta span {
  display: block;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.buyer-note {
  border: 1px solid #dbeafe;
  background: #eff6ff;
  border-radius: 8px;
  padding: 16px;
}
.buyer-note strong {
  color: #0f172a;
}
.buyer-note p {
  margin: 8px 0 0;
  color: #334155;
  white-space: pre-line;
  line-height: 1.5;
}
.request-product-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.request-product-card {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  background: #fff;
}
.request-product-image {
  width: 96px;
  height: 82px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f8fafc;
  overflow: hidden;
}
.request-product-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #fff;
}
.request-product-image .pi {
  color: #94a3b8;
  font-size: 28px;
}
.request-product-card strong,
.request-product-card span,
.request-product-card small {
  display: block;
}
.request-product-card strong {
  color: #0f172a;
  line-height: 1.25;
}
.request-product-card span,
.request-product-card small {
  color: #64748b;
  margin-top: 4px;
}
.doc-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.message-row {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px 16px;
  background: #fff;
}
.message-row div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #64748b;
  font-size: 12px;
}
.message-row div strong {
  color: #0f172a;
}
.message-row p {
  margin: 8px 0 0;
  color: #334155;
  line-height: 1.5;
  white-space: pre-line;
}
@media (max-width: 860px) {
  .request-detail-meta,
  .request-product-grid {
    grid-template-columns: 1fr;
  }
}
</style>
