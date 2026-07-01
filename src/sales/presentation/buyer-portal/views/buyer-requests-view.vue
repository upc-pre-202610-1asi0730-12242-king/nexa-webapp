<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/iam/application/iam.store';
import { useDataStore } from '@/app/application/stores/data.store';
import {
  requestStatusLabel,
  requestStatusBadge,
  displayCode,
  recordTimestamp,
  formatCalendarDate,
  formatRecordDateTime,
} from '@/shared/status';
import { creditSummary } from '@/shared/credit';
import { formatAddress } from '@/shared/utils/address.utils';

const router = useRouter();
const auth = useAuthStore();
const ds = useDataStore();
const requests = computed(() =>
  ds.D.purchaseRequests
    .filter(request => ds.clientRecordMatches(request, auth.user?.clientId))
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
);
const client = computed(() => ds.clientById(auth.user?.clientId) || {});
const credit = computed(() => creditSummary(client.value));
const openRequests = computed(() => requests.value.filter(request => !['converted_to_order', 'approved', 'rejected'].includes(request.status)).length);
const latestRequest = computed(() => requests.value[0]);

function requestItems(request) {
  return ds.requestItemsFor(request.id).map(item => {
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
  });
}

function requestTotal(request) {
  return requestItems(request).reduce((sum, item) => sum + item.subtotal, 0);
}

function visibleMessages(request) {
  return ds.messagesForRequest(request.id).filter(message => message.visibleToBuyer !== false);
}

function deliveryText(request) {
  return formatAddress(
    request.deliveryAddress,
    request.deliveryDistrict,
    request.deliveryCity,
    request.deliveryProvince,
  ) || request.deliveryAddressId || 'Delivery address pending';
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">{{ $t('portal.nav.requests') }}</div>
        <div class="page-subtitle">{{ requests.length }} buyer request(s) from the active workspace.</div>
      </div>
      <button class="btn btn-primary" @click="router.push('/portal/product-catalog')">
        <i class="pi pi-plus"></i> New request
      </button>
    </div>

    <div class="grid-3 buyer-request-kpis">
      <div class="card kpi-card">
        <div class="kpi-label"><i class="pi pi-inbox" style="color:#2563EB"></i> Open requests</div>
        <div class="kpi-value" style="color:#2563EB">{{ openRequests }}</div>
        <div class="kpi-sub">Requests awaiting Sales validation or buyer adjustment.</div>
      </div>
      <div class="card kpi-card">
        <div class="kpi-label"><i class="pi pi-credit-card" style="color:#16A34A"></i> Available credit</div>
        <div class="kpi-value" style="color:#16A34A">S/ {{ credit.available.toLocaleString('en-US') }}</div>
        <div class="kpi-sub">{{ credit.statusLabel }} · due {{ credit.dueDate }}</div>
      </div>
      <div class="card kpi-card">
        <div class="kpi-label"><i class="pi pi-clock" style="color:#F59E0B"></i> Latest request</div>
        <div class="kpi-value buyer-request-latest">{{ latestRequest ? displayCode(latestRequest) : '-' }}</div>
        <div class="kpi-sub">{{ latestRequest ? requestStatusLabel(latestRequest.status) : 'No request activity yet.' }}</div>
      </div>
    </div>

    <div v-if="!requests.length" class="empty-state">
      <div class="empty-state-icon"><i class="pi pi-inbox"></i></div>
      <div class="empty-state-title">No requests yet</div>
      <div class="empty-state-desc">Create a request from the product catalog or wait for request records to load.</div>
    </div>

    <div v-else class="flow-stack">
      <article v-for="request in requests" :key="request.id" class="buyer-card flow-panel-pad buyer-request-card">
        <div class="flow-row-between buyer-request-card-head">
          <div>
            <div class="flow-row" style="margin-bottom:6px">
              <span class="mono" style="font-weight:800;color:#1D4ED8">{{ displayCode(request) }}</span>
              <span :class="'badge ' + requestStatusBadge(request.status)">{{ requestStatusLabel(request.status) }}</span>
              <span v-if="request.priority" class="flow-pill flow-pill-blue">{{ request.priority }}</span>
            </div>
            <div class="flow-note">{{ request.comments || 'No buyer specifications provided.' }}</div>
            <div class="buyer-request-address"><i class="pi pi-map-marker"></i> {{ deliveryText(request) }}</div>
          </div>
          <button class="btn btn-primary btn-sm" @click="router.push('/portal/purchase-requests/' + request.id)">Details</button>
        </div>

        <div class="buyer-request-meta-grid">
          <div><span>Created</span><strong>{{ formatRecordDateTime(request.createdAt) }}</strong></div>
          <div><span>Requested delivery</span><strong>{{ formatCalendarDate(request.requestedDeliveryDate) }}</strong></div>
          <div><span>Items</span><strong>{{ requestItems(request).length }} line(s)</strong></div>
          <div><span>Estimated total</span><strong>S/ {{ requestTotal(request).toFixed(2) }}</strong></div>
          <div><span>Payment</span><strong>{{ request.paymentOption || client.paymentCondition || 'To confirm' }}</strong></div>
        </div>

        <div v-if="requestItems(request).length" class="request-product-strip">
          <article v-for="item in requestItems(request).slice(0, 3)" :key="item.id || item.productId" class="request-product-mini">
            <div class="request-product-mini-image">
              <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" />
              <i v-else class="pi pi-box"></i>
            </div>
            <div>
              <strong>{{ item.name }}</strong>
              <span>{{ item.quantity }} {{ item.unit }} · {{ item.sku }}</span>
            </div>
          </article>
        </div>

        <div class="buyer-request-thread">
          <div>
            <strong>{{ visibleMessages(request).length }} chat update(s)</strong>
            <span>{{ visibleMessages(request)[0]?.body || 'Sales observations will appear here.' }}</span>
          </div>
          <i class="pi pi-comments"></i>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.buyer-request-kpis {
  margin-bottom: 18px;
}
.buyer-request-latest {
  color: #f59e0b;
  font-size: clamp(20px, 1.8vw, 28px);
}
.buyer-request-card {
  display: grid;
  gap: 16px;
}
.buyer-request-card-head {
  align-items: flex-start;
  gap: 18px;
}
.buyer-request-address {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  color: #475569;
  font-size: 12px;
  font-weight: 760;
}
.buyer-request-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}
.buyer-request-meta-grid div {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  padding: 12px;
}
.buyer-request-meta-grid span {
  display: block;
  margin-bottom: 5px;
  color: #64748b;
  font-size: 11px;
  font-weight: 850;
  text-transform: uppercase;
}
.buyer-request-meta-grid strong {
  color: #0f172a;
  font-size: 13px;
}
.request-product-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.request-product-mini {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px;
  background: #fff;
}
.request-product-mini-image {
  width: 58px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: #f8fafc;
  overflow: hidden;
}
.request-product-mini-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.request-product-mini-image .pi {
  color: #94a3b8;
  font-size: 20px;
}
.request-product-mini strong,
.request-product-mini span {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.request-product-mini strong {
  color: #0f172a;
  font-size: 13px;
}
.request-product-mini span {
  margin-top: 3px;
  color: #64748b;
  font-size: 12px;
}
.buyer-request-thread {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #eff6ff;
  padding: 12px 14px;
  color: #1e40af;
}
.buyer-request-thread strong,
.buyer-request-thread span {
  display: block;
}
.buyer-request-thread span {
  margin-top: 4px;
  color: #334155;
  font-size: 13px;
  line-height: 1.4;
}
@media (max-width: 900px) {
  .buyer-request-meta-grid,
  .request-product-strip {
    grid-template-columns: 1fr;
  }
  .buyer-request-card-head {
    display: grid;
  }
}
</style>
