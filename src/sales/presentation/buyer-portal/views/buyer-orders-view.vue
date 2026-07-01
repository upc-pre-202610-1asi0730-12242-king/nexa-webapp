<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/iam/application/iam.store';
import { useDataStore } from '@/app/application/stores/data.store';
import { orderStatusLabel, orderStatusBadge, buildOrderTrackingSteps, displayCode, recordTimestamp, documentStatusLabel, documentStatusBadge, effectiveOrderStatus } from '@/shared/status';
import { formatAddress } from '@/shared/utils/address.utils';

const router = useRouter();
const auth = useAuthStore();
const ds = useDataStore();

const eligibleOrders = computed(() => ds.D.purchaseOrders
  .filter(order => ds.clientRecordMatches(order, auth.user?.clientId)));
const lifecycleEventsByOrder = computed(() => new Map(eligibleOrders.value
  .map(order => [String(order.id), ds.lifecycleEventsForOrder(order.id)])));
const eventsFor = order => lifecycleEventsByOrder.value.get(String(order.id)) || [];
const orders = computed(() => [...eligibleOrders.value]
  .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))));
const activeOrders = computed(() => orders.value.filter(order => !['delivered', 'cancelled', 'rejected'].includes(statusFor(order))));
const totalPendingDocs = computed(() => orders.value.reduce((sum, order) => sum + docsFor(order).filter(doc => doc.status !== 'ready').length, 0));
const nextOrder = computed(() => orders.value[0]);

function dispatchFor(order) {
  return ds.dispatchForOrder(order.id);
}

function statusFor(order) {
  return effectiveOrderStatus(order.status, dispatchFor(order)?.status);
}

function trackedOrder(order) {
  return { ...order, status: statusFor(order) };
}

function stepsFor(order) {
  return buildOrderTrackingSteps(trackedOrder(order), eventsFor(order));
}

function docsFor(order) {
  return ds.documentsForOrder(order.id).filter(doc => doc.visibleToBuyer || doc.required);
}

function latestTemperature(order) {
  const rows = ds.temperatureForOrder(order.id).filter(log => log.visibleToBuyer !== false);
  return rows[rows.length - 1];
}

function deliveryText(order) {
  const delivery = order.delivery || {};
  const street = [delivery.addressType, delivery.address].filter(Boolean).join(' ');
  return formatAddress(street, delivery.district, delivery.city, delivery.province) || order.deliveryAddress || 'Delivery address pending';
}
</script>

<template>
  <div class="page-header">
    <div>
      <div class="page-title">{{ $t('portal.nav.orders') }}</div>
      <div class="page-subtitle">{{ orders.length }} confirmed or historical purchase orders.</div>
    </div>
    <button class="btn btn-primary" @click="router.push('/portal/product-catalog')"><i class="pi pi-plus"></i> New Request</button>
  </div>

  <div class="grid-3 buyer-order-kpis">
    <div class="card kpi-card">
      <div class="kpi-label"><i class="pi pi-truck" style="color:#2563EB"></i> Active orders</div>
      <div class="kpi-value" style="color:#2563EB">{{ activeOrders.length }}</div>
      <div class="kpi-sub">Orders still moving through Sales, documents or dispatch.</div>
    </div>
    <div class="card kpi-card">
      <div class="kpi-label"><i class="pi pi-file-check" style="color:#F59E0B"></i> Pending documents</div>
      <div class="kpi-value" style="color:#F59E0B">{{ totalPendingDocs }}</div>
      <div class="kpi-sub">Required documents not ready for download.</div>
    </div>
    <div class="card kpi-card">
      <div class="kpi-label"><i class="pi pi-clock" style="color:#16A34A"></i> Latest activity</div>
      <div class="kpi-value buyer-order-latest">{{ nextOrder ? displayCode(nextOrder) : '-' }}</div>
      <div class="kpi-sub">{{ nextOrder ? orderStatusLabel(statusFor(nextOrder)) : 'No order activity yet.' }}</div>
    </div>
  </div>

  <div v-if="!orders.length" class="empty-state">
    <div class="empty-state-icon"><i class="pi pi-clipboard"></i></div>
    <div class="empty-state-title">No confirmed purchase orders yet</div>
    <div class="empty-state-desc">When Sales accepts a request and creates the order, it will appear here.</div>
  </div>

  <div v-else class="flow-stack">
    <article v-for="order in orders" :key="order.id" class="buyer-card flow-panel-pad buyer-order-card">
      <div class="flow-row-between buyer-order-card-head">
        <div>
          <div class="flow-row" style="margin-bottom:5px">
            <span class="mono" style="font-weight:800;color:#1D4ED8">{{ displayCode(order) }}</span>
            <span :class="'badge ' + orderStatusBadge(statusFor(order))">{{ orderStatusLabel(statusFor(order)) }}</span>
            <span v-if="dispatchFor(order)" class="flow-pill flow-pill-blue">{{ dispatchFor(order).code || dispatchFor(order).id }}</span>
          </div>
          <div class="flow-note">{{ order.createdAt?.slice(0, 10) }} - {{ ds.orderItemsFor(order.id).length }} item(s) - {{ order.totalEstimatedWeightKg || 'pending' }} kg</div>
          <div class="buyer-order-address"><i class="pi pi-map-marker"></i> {{ deliveryText(order) }}</div>
        </div>
        <div style="text-align:right">
          <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:20px;font-weight:800">S/ {{ Number(order.total || 0).toFixed(2) }}</div>
          <button class="btn btn-primary btn-sm" style="margin-top:8px" @click="router.push('/portal/purchase-orders/' + order.id)">Tracking</button>
        </div>
      </div>

      <div class="buyer-order-meta-grid">
        <div>
          <span>Documents</span>
          <strong>{{ docsFor(order).filter(doc => doc.status === 'ready').length }}/{{ docsFor(order).length }} ready</strong>
        </div>
        <div>
          <span>Temperature</span>
          <strong>{{ latestTemperature(order)?.temperatureC !== undefined ? `${latestTemperature(order).temperatureC} C` : 'Pending' }}</strong>
        </div>
        <div>
          <span>Route</span>
          <strong>{{ dispatchFor(order)?.routeName || 'Not assigned yet' }}</strong>
        </div>
      </div>

      <div v-if="docsFor(order).length" class="buyer-doc-chip-row">
        <span
          v-for="doc in docsFor(order).slice(0, 3)"
          :key="doc.id"
          :class="'badge ' + documentStatusBadge(doc.status)"
        >
          {{ documentStatusLabel(doc.status) }} · {{ doc.label }}
        </span>
      </div>

      <div class="flow-timeline-horizontal">
        <div
          v-for="step in stepsFor(order)"
          :key="step.key"
          class="flow-track-step"
          :class="step.state"
        >
          <div class="flow-track-index">{{ step.index }}</div>
          <div class="flow-track-label">{{ step.label }}</div>
          <div class="flow-track-date">{{ step.dateLabel }}</div>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
.buyer-order-kpis {
  margin-bottom: 18px;
}
.buyer-order-latest {
  color: #16a34a;
  font-size: clamp(20px, 1.8vw, 28px);
}
.buyer-order-card {
  display: grid;
  gap: 16px;
}
.buyer-order-card-head {
  align-items: flex-start;
  gap: 18px;
}
.buyer-order-address {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  color: #475569;
  font-size: 12px;
  font-weight: 760;
}
.buyer-order-meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.buyer-order-meta-grid div {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  padding: 12px;
}
.buyer-order-meta-grid span {
  display: block;
  margin-bottom: 5px;
  color: #64748b;
  font-size: 11px;
  font-weight: 850;
  text-transform: uppercase;
}
.buyer-order-meta-grid strong {
  color: #0f172a;
  font-size: 13px;
}
.buyer-doc-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
@media (max-width: 760px) {
  .buyer-order-card-head,
  .buyer-order-meta-grid {
    grid-template-columns: 1fr;
  }
  .buyer-order-card-head {
    display: grid;
  }
}
</style>
