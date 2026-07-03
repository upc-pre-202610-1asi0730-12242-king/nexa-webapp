<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useDataStore } from '@/app/application/stores/data.store';
import { useAuthStore } from '@/iam/application/iam.store';
import { coldTypeLabel, coldTypeBadge, orderStatusLabel, orderStatusBadge, daysUntil, displayCode } from '@/shared/status';
import { creditSummary } from '@/shared/credit';

const router = useRouter();
const { t, locale } = useI18n();
const ds = useDataStore();
const auth = useAuthStore();
const D = ds.D;

const lowStock = computed(() => D.products.filter(product => ['low', 'out'].includes(product.status)));
const expiringLots = computed(() => D.inventoryLots.filter(lot => daysUntil(lot.expiry || lot.expirationDate) <= 30));
const dispatchOrdersToday = computed(() => D.dispatchOrders.filter(dispatchOrder => !['delivered'].includes(dispatchOrder.status)));
const pendingPod = computed(() => D.dispatchOrders.filter(dispatch =>
  !D.proofOfDelivery.some(pod => pod.dispatchOrderId === dispatch.id && pod.status === 'complete')
));
const incidents = computed(() => D.dispatchOrders.filter(dispatch => dispatch.status === 'incident'));
const creditFor = (dispatch) => creditSummary(ds.clientById(dispatch.clientId) || {});
const etaLabel = (dispatch) => dispatch.eta
  ? new Date(dispatch.eta).toLocaleString(locale.value === 'es' ? 'es-PE' : 'en-US')
  : t('operationsDashboard.notScheduled');
const canManageCompany = computed(() =>
  auth.permissions.includes('*') || auth.tenant?.capabilities?.includes('workspace-operations-setup')
);
</script>

<template>
  <div class="page-header">
    <div>
      <div class="page-title">{{ t('operationsDashboard.title') }}</div>
      <div class="page-subtitle">{{ t('operationsDashboard.subtitle') }}</div>
    </div>
    <button class="btn btn-primary" @click="router.push('/ops/operations/dispatch-orders')">
      <i class="pi pi-send"></i> {{ t('nav.dispatchBoard') }}
    </button>
  </div>

  <div class="flow-action-banner">
    <div>
      <div class="flow-eyebrow">{{ t('operationsDashboard.bannerEyebrow') }}</div>
      <div class="flow-title">{{ t('operationsDashboard.bannerTitle', { dispatches: dispatchOrdersToday.length, pod: pendingPod.length, lots: expiringLots.length }) }}</div>
      <div class="flow-note">{{ t('operationsDashboard.bannerNote') }}</div>
    </div>
    <button class="btn btn-secondary" @click="router.push('/ops/operations/proof-of-delivery')"><i class="pi pi-camera"></i> {{ t('nav.evidence') }}</button>
  </div>

  <div class="grid-4" style="margin-bottom:18px">
    <div class="card kpi-card">
      <div class="kpi-label"><i class="pi pi-database" style="color:#EF4444"></i> {{ t('operationsDashboard.criticalStock') }}</div>
      <div class="kpi-value" style="color:#EF4444">{{ lowStock.length }}</div>
      <div class="kpi-sub">{{ t('operationsDashboard.criticalStockSub') }}</div>
    </div>
    <div class="card kpi-card">
      <div class="kpi-label"><i class="pi pi-clock" style="color:#F59E0B"></i> {{ t('operationsDashboard.fefoLots') }}</div>
      <div class="kpi-value" style="color:#F59E0B">{{ expiringLots.length }}</div>
      <div class="kpi-sub">{{ t('operationsDashboard.fefoLotsSub') }}</div>
    </div>
    <div class="card kpi-card">
      <div class="kpi-label"><i class="pi pi-send" style="color:#2563EB"></i> {{ t('operationsDashboard.activeDispatches') }}</div>
      <div class="kpi-value" style="color:#2563EB">{{ dispatchOrdersToday.length }}</div>
      <div class="kpi-sub">{{ t('operationsDashboard.activeDispatchesSub') }}</div>
    </div>
    <div class="card kpi-card">
      <div class="kpi-label"><i class="pi pi-camera" style="color:#4F46E5"></i> {{ t('operationsDashboard.pendingPod') }}</div>
      <div class="kpi-value" style="color:#4F46E5">{{ pendingPod.length }}</div>
      <div class="kpi-sub">{{ t('operationsDashboard.openIncidents', { count: incidents.length }) }}</div>
    </div>
  </div>

  <div class="flow-grid-12">
    <section class="flow-panel span-7">
      <div class="flow-panel-head">
        <div>
          <div class="flow-title">{{ t('operationsDashboard.dispatchBoard') }}</div>
          <div class="flow-subtitle">{{ t('operationsDashboard.dispatchBoardSub') }}</div>
        </div>
        <button class="btn btn-ghost btn-sm" @click="router.push('/ops/operations/dispatch-orders')">{{ t('nav.dispatchBoard') }}</button>
      </div>
      <div class="flow-panel-pad flow-stack">
        <div v-for="dispatch in D.dispatchOrders.slice(0, 5)" :key="dispatch.id" class="flow-list-item">
          <div>
            <div class="flow-row" style="margin-bottom:5px">
              <span class="mono">{{ displayCode(dispatch) }}</span>
              <span :class="'badge ' + orderStatusBadge(dispatch.status)">{{ orderStatusLabel(dispatch.status) }}</span>
              <span :class="coldTypeBadge(dispatch.coldType)">{{ coldTypeLabel(dispatch.coldType) }}</span>
              <span :class="'badge ' + creditFor(dispatch).badgeClass">{{ creditFor(dispatch).statusLabel }}</span>
            </div>
            <div style="font-size:13px;font-weight:800">{{ ds.clientName(dispatch.clientId) }}</div>
            <div class="flow-note">{{ t('operationsDashboard.dispatchMeta', { route: dispatch.routeName || t('operationsDashboard.routePending'), eta: etaLabel(dispatch), available: creditFor(dispatch).available.toLocaleString() }) }}</div>
          </div>
          <button class="btn btn-primary btn-sm" @click="router.push('/ops/operations/dispatch-orders/' + dispatch.id)">{{ t('common.open') }}</button>
        </div>
        <div v-if="!D.dispatchOrders.length" class="empty-state compact">{{ t('operationsDashboard.noDispatches') }}</div>
      </div>
    </section>

    <section class="flow-panel span-5">
      <div class="flow-panel-head"><div class="flow-title">{{ t('operationsDashboard.operationalAlerts') }}</div></div>
      <div class="flow-panel-pad flow-stack">
        <div v-for="product in lowStock" :key="product.id" class="flow-list-item">
          <div>
            <div style="font-weight:800">{{ product.name }}</div>
            <div class="flow-note">{{ t('operationsDashboard.stockAvailability', { available: product.stock - product.reserved, unit: product.unit, minimum: product.minStock }) }}</div>
          </div>
          <span :class="'badge ' + (product.status === 'out' ? 'badge-red' : 'badge-amber')">{{ product.status }}</span>
        </div>
        <div v-for="lot in expiringLots.slice(0, 3)" :key="lot.id" class="flow-list-item">
          <div>
            <div style="font-weight:800">{{ ds.productName(lot.productId) }}</div>
            <div class="flow-note">{{ t('operationsDashboard.lotDue', { id: lot.id, date: lot.expiry, priority: lot.fefoPriority }) }}</div>
          </div>
          <span class="badge badge-amber">{{ t('operationsDashboard.days', { count: daysUntil(lot.expiry) }) }}</span>
        </div>
        <div v-if="!lowStock.length && !expiringLots.length" class="empty-state compact">{{ t('operationsDashboard.noAlerts') }}</div>
      </div>
    </section>

    <section class="flow-panel span-12 operations-quick-actions">
      <div class="flow-panel-head"><div class="flow-title">{{ t('operationsDashboard.quickActions') }}</div></div>
      <div class="flow-panel-pad quick-action-grid">
        <button class="btn btn-secondary" @click="router.push('/ops/operations/inventory-control')"><i class="pi pi-database"></i> {{ t('nav.inventory') }}</button>
        <button class="btn btn-primary" @click="router.push('/ops/operations/dispatch-orders')"><i class="pi pi-send"></i> {{ t('nav.dispatchBoard') }}</button>
        <button class="btn btn-secondary" @click="router.push('/ops/operations/proof-of-delivery')"><i class="pi pi-camera"></i> {{ t('nav.evidence') }}</button>
        <button class="btn btn-secondary" @click="router.push('/ops/operations/operational-analytics')"><i class="pi pi-chart-bar"></i> {{ t('nav.operationalAnalytics') }}</button>
        <button class="btn btn-secondary" @click="router.push('/ops/operations/business-documents')"><i class="pi pi-file-check"></i> {{ t('nav.documents') }}</button>
        <button v-if="canManageCompany" class="btn btn-secondary" @click="router.push('/ops/operations/company-administration')"><i class="pi pi-building"></i> {{ t('nav.companyAdministration') }}</button>
      </div>
    </section>
  </div>
</template>
