<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDataStore } from '@/app/application/stores/data.store';

const { t } = useI18n();
const ds = useDataStore();
const totalOrders = computed(() => ds.D.purchaseOrders.length);
const ordersByStatus = computed(() => ds.D.purchaseOrders.reduce((acc, order) => {
  acc[order.status] = (acc[order.status] || 0) + 1;
  return acc;
}, {}));
const tempAttention = computed(() => ds.D.temperatureLogs.filter(log => log.status !== 'ok'));
const tempHealthRate = computed(() => ds.D.temperatureLogs.length
  ? Math.round(((ds.D.temperatureLogs.length - tempAttention.value.length) / ds.D.temperatureLogs.length) * 100)
  : 100);
const movementCount = computed(() => ds.D.stockMovements.length);
const deliveredOrders = computed(() => ds.D.purchaseOrders.filter(order => ['delivered', 'completed'].includes(order.status)).length);
const fulfillmentRate = computed(() => totalOrders.value ? Math.round((deliveredOrders.value / totalOrders.value) * 100) : 0);
const documentsReady = computed(() => ds.D.businessDocuments.filter(document => ['ready', 'uploaded', 'accepted'].includes(document.status)).length);
const documentReadiness = computed(() => ds.D.businessDocuments.length ? Math.round((documentsReady.value / ds.D.businessDocuments.length) * 100) : 0);
const maxStatusCount = computed(() => Math.max(1, ...statusRows.value.map(row => row.count)));
const maxRouteCount = computed(() => Math.max(1, ...routeRows.value.map(row => row.count)));
const statusRows = computed(() => Object.entries(ordersByStatus.value).map(([status, count]) => ({
  status,
  label: statusLabel(status),
  count,
  percent: totalOrders.value ? Math.round((count / totalOrders.value) * 100) : 0,
  tone: statusTone(status),
})).sort((a, b) => b.count - a.count));
const routeRows = computed(() => Object.entries(ds.D.dispatchOrders.reduce((acc, dispatch) => {
  const route = dispatch.routeName || t('operationalAnalytics.routePending');
  acc[route] = (acc[route] || 0) + 1;
  return acc;
}, {})).map(([route, count]) => ({
  route,
  count,
  percent: ds.D.dispatchOrders.length ? Math.round((count / ds.D.dispatchOrders.length) * 100) : 0,
})).sort((a, b) => b.count - a.count));
const controlMetrics = computed(() => [
  {
    label: t('operationalAnalytics.fulfillment'),
    value: `${fulfillmentRate.value}%`,
    detail: t('operationalAnalytics.fulfillmentDetail', { delivered: deliveredOrders.value, total: totalOrders.value }),
    score: fulfillmentRate.value,
    icon: 'pi pi-check-circle',
  },
  {
    label: t('operationalAnalytics.documentReadiness'),
    value: `${documentReadiness.value}%`,
    detail: t('operationalAnalytics.documentReadinessDetail', { ready: documentsReady.value, total: ds.D.businessDocuments.length }),
    score: documentReadiness.value,
    icon: 'pi pi-file-check',
  },
  {
    label: t('operationalAnalytics.temperatureHealth'),
    value: `${tempHealthRate.value}%`,
    detail: t('operationalAnalytics.temperatureHealthDetail', { count: tempAttention.value.length }),
    score: tempHealthRate.value,
    icon: 'pi pi-thermometer',
  },
]);
const stockMovementPreview = computed(() => ds.D.stockMovements.slice(0, 8));
const stockProductsTouched = computed(() => new Set(ds.D.stockMovements.map(movement => movement.productId)).size);

function statusLabel(status) {
  return {
    pending: t('operationalAnalytics.status.pending'),
    submitted: t('operationalAnalytics.status.submitted'),
    approved: t('operationalAnalytics.status.approved'),
    ready: t('operationalAnalytics.status.ready'),
    ready_for_dispatch: t('operationalAnalytics.status.readyForDispatch'),
    in_progress: t('operationalAnalytics.status.inProgress'),
    delivered: t('operationalAnalytics.status.delivered'),
    completed: t('operationalAnalytics.status.completed'),
    cancelled: t('operationalAnalytics.status.cancelled'),
    rejected: t('operationalAnalytics.status.rejected'),
    blocked: t('operationalAnalytics.status.blocked'),
  }[status] || String(status || 'unknown').replaceAll('_', ' ');
}

function statusTone(status) {
  if (['delivered', 'completed', 'approved', 'ready'].includes(status)) return 'green';
  if (['pending', 'submitted', 'scheduled', 'in_progress', 'ready_for_dispatch'].includes(status)) return 'blue';
  if (['cancelled', 'rejected', 'blocked'].includes(status)) return 'red';
  return 'amber';
}

function maxBarWidth(count, maxValue) {
  return `${Math.max(8, Math.round((count / maxValue) * 100))}%`;
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">{{ t('operationalAnalytics.title') }}</div>
        <div class="page-subtitle">{{ t('operationalAnalytics.currentKpiSubtitle') }}</div>
      </div>
    </div>

    <section class="analytics-hero">
      <div class="analytics-hero-copy">
        <span>{{ t('operationalAnalytics.controlTower') }}</span>
        <strong>{{ t('operationalAnalytics.heroTitle') }}</strong>
        <p>{{ t('operationalAnalytics.heroDesc') }}</p>
      </div>
      <div class="control-metrics">
        <article v-for="metric in controlMetrics" :key="metric.label" class="control-metric">
          <div class="metric-ring" :style="{ background: `conic-gradient(#2563eb ${metric.score * 3.6}deg, #e2e8f0 0deg)` }">
            <span>{{ metric.value }}</span>
          </div>
          <div>
            <i :class="metric.icon"></i>
            <strong>{{ metric.label }}</strong>
            <small>{{ metric.detail }}</small>
          </div>
        </article>
      </div>
    </section>

    <div class="grid-4" style="margin-bottom:18px">
      <div class="card kpi-card">
        <div class="kpi-label"><i class="pi pi-box"></i> {{ t('operationalAnalytics.catalogItems') }}</div>
        <div class="kpi-value">{{ ds.D.products.length }}</div>
        <div class="kpi-sub">{{ t('operationalAnalytics.catalogItemsSub') }}</div>
      </div>
      <div class="card kpi-card">
        <div class="kpi-label"><i class="pi pi-shopping-cart"></i> {{ t('operationalAnalytics.orders') }}</div>
        <div class="kpi-value">{{ ds.D.purchaseOrders.length }}</div>
        <div class="kpi-sub">{{ t('operationalAnalytics.ordersSub') }}</div>
      </div>
      <div class="card kpi-card">
        <div class="kpi-label"><i class="pi pi-truck"></i> {{ t('operationalAnalytics.shipments') }}</div>
        <div class="kpi-value">{{ ds.D.dispatchOrders.length }}</div>
        <div class="kpi-sub">{{ t('operationalAnalytics.shipmentsSub') }}</div>
      </div>
      <div class="card kpi-card">
        <div class="kpi-label"><i class="pi pi-thermometer" style="color:#F59E0B"></i> {{ t('operationalAnalytics.temperatureAlerts') }}</div>
        <div class="kpi-value" style="color:#F59E0B">{{ tempAttention.length }}</div>
        <div class="kpi-sub">{{ t('operationalAnalytics.temperatureAlertsSub') }}</div>
      </div>
    </div>

    <div class="grid-2" style="margin-bottom:18px">
      <section class="analytics-score-card">
        <div>
          <span class="meta-label">{{ t('operationalAnalytics.fulfillment') }}</span>
          <strong>{{ fulfillmentRate }}%</strong>
          <p>{{ t('operationalAnalytics.fulfillmentScoreDesc') }}</p>
        </div>
        <div class="analytics-meter"><span :style="{ width: fulfillmentRate + '%' }"></span></div>
      </section>
      <section class="analytics-score-card">
        <div>
          <span class="meta-label">{{ t('operationalAnalytics.documentReadiness') }}</span>
          <strong>{{ documentReadiness }}%</strong>
          <p>{{ t('operationalAnalytics.documentReadinessScoreDesc') }}</p>
        </div>
        <div class="analytics-meter"><span :style="{ width: documentReadiness + '%' }"></span></div>
      </section>
    </div>

    <div class="flow-grid-12">
      <section class="flow-panel span-6">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">{{ t('operationalAnalytics.byStatus') }}</div>
            <div class="flow-subtitle">{{ t('operationalAnalytics.byStatusSubtitle') }}</div>
          </div>
        </div>
        <div class="flow-panel-pad flow-stack">
          <div v-for="row in statusRows" :key="row.status" class="analytics-row">
            <div class="mini-row">
              <span class="status-label">{{ row.label }}</span>
              <strong>{{ row.count }} <small>{{ row.percent }}%</small></strong>
            </div>
            <div class="analytics-bar">
              <span :class="'tone-' + row.tone" :style="{ width: maxBarWidth(row.count, maxStatusCount) }"></span>
            </div>
          </div>
          <div v-if="!statusRows.length" class="empty-state compact">{{ t('operationalAnalytics.noPurchaseOrders') }}</div>
        </div>
      </section>

      <section class="flow-panel span-6">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">{{ t('operationalAnalytics.stockMovements') }}</div>
            <div class="flow-subtitle">{{ t('operationalAnalytics.stockMovementsSubtitle', { count: movementCount }) }}</div>
          </div>
        </div>
        <div class="flow-panel-pad flow-stack">
          <div class="movement-summary">
            <article>
              <span>{{ t('operationalAnalytics.totalMovements') }}</span>
              <strong>{{ movementCount }}</strong>
            </article>
            <article>
              <span>{{ t('operationalAnalytics.catalogTouched') }}</span>
              <strong>{{ stockProductsTouched }}</strong>
            </article>
          </div>
          <div v-for="movement in stockMovementPreview" :key="movement.id" class="mini-row movement-row">
            <span><span class="mono">{{ movement.reference }}</span> · {{ ds.productName(movement.productId) }}</span>
            <strong>{{ movement.qty }}</strong>
          </div>
          <div v-if="!ds.D.stockMovements.length" class="empty-state compact">
            <div class="empty-state-title">{{ t('operationalAnalytics.noMovementsTitle') }}</div>
            <div class="empty-state-desc">{{ t('operationalAnalytics.noMovementsDesc') }}</div>
          </div>
        </div>
      </section>

      <section class="flow-panel span-12">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">{{ t('operationalAnalytics.dispatchByRoute') }}</div>
            <div class="flow-subtitle">{{ t('operationalAnalytics.dispatchByRouteSubtitle') }}</div>
          </div>
        </div>
        <div class="flow-panel-pad route-analytics-grid">
          <div v-for="row in routeRows" :key="row.route" class="route-analytics-card">
            <div class="route-card-head">
              <span>{{ row.route }}</span>
              <strong>{{ row.count }}</strong>
            </div>
            <div class="analytics-bar"><span :style="{ width: maxBarWidth(row.count, maxRouteCount) }"></span></div>
            <small>{{ t('operationalAnalytics.dispatchWorkloadPercent', { percent: row.percent }) }}</small>
          </div>
          <div v-if="!routeRows.length" class="empty-state compact">{{ t('operationalAnalytics.noDispatchRoutes') }}</div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.analytics-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, .9fr);
  gap: 16px;
  align-items: stretch;
  margin-bottom: 18px;
  padding: 18px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 58%, #f8fbff 100%);
}
.analytics-hero-copy {
  display: grid;
  align-content: center;
  gap: 8px;
}
.analytics-hero-copy span {
  color: #2563eb;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: .04em;
  text-transform: uppercase;
}
.analytics-hero-copy strong {
  max-width: 760px;
  color: #0f172a;
  font-size: 24px;
  line-height: 1.2;
}
.analytics-hero-copy p {
  max-width: 720px;
  margin: 0;
  color: #475569;
  line-height: 1.55;
}
.control-metrics {
  display: grid;
  gap: 10px;
}
.control-metric {
  display: grid;
  grid-template-columns: 70px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  min-width: 0;
  padding: 12px;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: rgba(255,255,255,.82);
}
.metric-ring {
  width: 62px;
  height: 62px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  position: relative;
}
.metric-ring::after {
  content: "";
  position: absolute;
  inset: 7px;
  border-radius: 50%;
  background: #fff;
}
.metric-ring span {
  position: relative;
  z-index: 1;
  color: #0f172a;
  font-size: 13px;
  font-weight: 900;
}
.control-metric div:last-child {
  min-width: 0;
  display: grid;
  gap: 3px;
}
.control-metric i {
  color: #2563eb;
  font-size: 13px;
}
.control-metric strong {
  color: #0f172a;
  font-size: 13px;
}
.control-metric small {
  color: #64748b;
  font-size: 11px;
  line-height: 1.35;
}
.analytics-score-card {
  display: grid;
  gap: 14px;
  padding: 20px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #fff;
}
.analytics-score-card strong {
  display: block;
  margin-top: 5px;
  color: #1d4ed8;
  font-size: 34px;
  line-height: 1;
}
.analytics-score-card p {
  margin: 6px 0 0;
  color: #64748b;
}
.analytics-meter,
.analytics-bar {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}
.analytics-meter span,
.analytics-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #2563eb;
}
.analytics-bar span.tone-green {
  background: #16a34a;
}
.analytics-bar span.tone-amber {
  background: #f59e0b;
}
.analytics-bar span.tone-red {
  background: #dc2626;
}
.analytics-row {
  display: grid;
  gap: 6px;
}
.status-label {
  color: #334155;
  font-weight: 800;
  text-transform: capitalize;
}
.analytics-row strong small {
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
}
.movement-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 4px;
}
.movement-summary article {
  display: grid;
  gap: 3px;
  padding: 12px;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #f8fbff;
}
.movement-summary span {
  color: #64748b;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .04em;
}
.movement-summary strong {
  color: #0f172a;
  font-size: 22px;
  line-height: 1;
}
.movement-row {
  min-height: 38px;
  padding: 8px 0;
  border-bottom: 1px solid #edf2f7;
}
.route-analytics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.route-analytics-card {
  display: grid;
  gap: 10px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}
.route-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.route-analytics-card strong {
  color: #0f172a;
  font-size: 26px;
}
.route-analytics-card span,
.route-analytics-card small {
  color: #64748b;
}
.route-analytics-card span {
  font-size: 12px;
  font-weight: 900;
  line-height: 1.3;
}
@media (max-width: 980px) {
  .analytics-hero {
    grid-template-columns: 1fr;
  }
  .route-analytics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .route-analytics-grid,
  .movement-summary {
    grid-template-columns: 1fr;
  }
  .analytics-hero-copy strong {
    font-size: 20px;
  }
}
</style>
