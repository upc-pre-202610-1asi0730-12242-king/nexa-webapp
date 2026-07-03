<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useDataStore } from '@/app/application/stores/data.store';
import { orderStatusLabel, orderStatusBadge, coldTypeLabel, coldTypeBadge, priorityLabel, displayCode } from '@/shared/status';
import { creditSummary } from '@/shared/credit';

const router = useRouter();
const { t } = useI18n();
const ds = useDataStore();
const D = ds.D;
const search = ref('');
const routeFilter = ref('all');
const sortMode = ref('priority');
const busyDispatchId = ref(null);
const actionError = ref('');

const columns = [
  { key: 'ready_for_operations', labelKey: 'dispatch.board.columns.ready_for_operations', statuses: ['ready_for_operations'] },
  { key: 'preparing', labelKey: 'dispatch.board.columns.preparing', statuses: ['assigned', 'scheduled', 'preparing', 'ready_for_route', 'reprogrammed'] },
  { key: 'in_route', labelKey: 'dispatch.board.columns.in_route', statuses: ['in_route', 'delayed'] },
  { key: 'delivered', labelKey: 'dispatch.board.columns.delivered', statuses: ['delivered'] },
  { key: 'incident', labelKey: 'dispatch.board.columns.incident', statuses: ['incident', 'cancelled', 'rejected'] },
];

const routes = computed(() => ['all', ...new Set(D.dispatchOrders.map(dispatch => dispatch.routeName).filter(Boolean))]);
const sortOptions = [
  { value: 'priority', labelKey: 'dispatch.board.sortOptions.priority' },
  { value: 'eta', labelKey: 'dispatch.board.sortOptions.eta' },
  { value: 'route', labelKey: 'dispatch.board.sortOptions.route' },
  { value: 'client', labelKey: 'dispatch.board.sortOptions.client' },
  { value: 'status', labelKey: 'dispatch.board.sortOptions.status' },
  { value: 'newest', labelKey: 'dispatch.board.sortOptions.newest' },
];
const priorityRank = { high: 0, medium: 1, normal: 1, low: 2 };

const filtered = computed(() => {
  let rows = D.dispatchOrders;
  if (routeFilter.value !== 'all') rows = rows.filter(dispatch => dispatch.routeName === routeFilter.value);
  if (search.value) {
    const q = search.value.toLowerCase();
    rows = rows.filter(dispatch =>
      displayCode(dispatch).toLowerCase().includes(q) ||
      String(dispatch.orderId).toLowerCase().includes(q) ||
      ds.clientName(dispatch.clientId).toLowerCase().includes(q) ||
      String(dispatch.routeName || '').toLowerCase().includes(q) ||
      orderStatusLabel(dispatch.status).toLowerCase().includes(q)
    );
  }
  return [...rows].sort((a, b) => {
    if (sortMode.value === 'eta') return new Date(a.eta || '2999-12-31') - new Date(b.eta || '2999-12-31');
    if (sortMode.value === 'route') return String(a.routeName || '').localeCompare(String(b.routeName || ''));
    if (sortMode.value === 'client') return ds.clientName(a.clientId).localeCompare(ds.clientName(b.clientId));
    if (sortMode.value === 'status') return String(a.status || '').localeCompare(String(b.status || ''));
    if (sortMode.value === 'newest') return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
    return (priorityRank[a.priority] ?? 3) - (priorityRank[b.priority] ?? 3);
  });
});

function byColumn(column) {
  return filtered.value.filter(dispatch => (column.statuses || [column.key]).includes(dispatch.column || dispatch.status));
}

function isDelayed(dispatch) {
  return dispatch.status === 'delayed' || (dispatch.eta && new Date(dispatch.eta) < new Date() && !['delivered', 'incident'].includes(dispatch.status));
}

function creditFor(dispatch) {
  return creditSummary(ds.clientById(dispatch.clientId) || {});
}

function etaLabel(dispatch) {
  return dispatch.eta ? new Date(dispatch.eta).toLocaleDateString('en-US') : t('dispatch.board.notScheduled');
}

async function moveForward(dispatch) {
  const next = {
    ready_for_operations: 'preparing',
    preparing: 'ready_for_route',
    scheduled: 'ready_for_route',
    assigned: 'ready_for_route',
    ready_for_route: 'in_route',
    in_route: 'delivered',
    delayed: 'in_route',
  }[dispatch.status] || 'preparing';
  if (busyDispatchId.value || ['incident', 'cancelled', 'rejected', 'delivered'].includes(dispatch.status)) return;
  busyDispatchId.value = dispatch.id;
  actionError.value = '';
  try {
    await ds.updateDispatchStatus(dispatch.id, next);
  } catch (error) {
    actionError.value = error?.response?.data?.detail
      || error?.response?.data?.message
      || error?.message
      || t('dispatch.board.updateError');
  } finally {
    busyDispatchId.value = null;
  }
}
</script>

<template>
  <div class="page-header">
    <div>
      <div class="page-title">{{ t('dispatch.board.title') }}</div>
      <div class="page-subtitle">{{ t('dispatch.board.subtitle', { count: D.dispatchOrders.length }) }}</div>
    </div>
    <button class="btn btn-secondary" @click="router.push('/ops/operations/proof-of-delivery')">
      <i class="pi pi-camera"></i> {{ t('dispatch.board.proofOfDelivery') }}
    </button>
  </div>

  <div class="filter-bar">
    <div class="search-input">
      <i class="pi pi-search"></i>
      <input v-model="search" :placeholder="t('dispatch.searchPlaceholder')" :aria-label="t('dispatch.searchPlaceholder')" />
    </div>
    <label class="dispatch-filter-select">
      <span>{{ t('dispatch.board.route') }}</span>
      <select v-model="routeFilter" :aria-label="t('dispatch.allRoutes')">
        <option v-for="routeName in routes" :key="routeName" :value="routeName">
          {{ routeName === 'all' ? t('dispatch.allRoutes') : routeName }}
        </option>
      </select>
    </label>
    <label class="dispatch-filter-select">
      <span>{{ t('dispatch.board.sort') }}</span>
      <select v-model="sortMode">
        <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{ t(option.labelKey) }}</option>
      </select>
    </label>
  </div>

  <div v-if="actionError" class="banner banner-danger" style="margin-bottom:16px">
    <i class="pi pi-exclamation-triangle"></i>
    <div>{{ actionError }}</div>
  </div>

  <div class="kanban-board">
    <section v-for="column in columns" :key="column.key" class="kanban-column">
      <div class="kanban-column-head">
        <div class="kanban-column-title">{{ t(column.labelKey) }}</div>
        <span class="flow-pill">{{ byColumn(column).length }}</span>
      </div>

      <article
        v-for="dispatch in byColumn(column)"
        :key="dispatch.id"
        class="dispatch-card"
        @click="router.push('/ops/operations/dispatch-orders/' + dispatch.id)"
      >
        <div class="flow-row-between" style="margin-bottom:8px">
          <span class="mono">{{ displayCode(dispatch) }}</span>
          <span :class="'badge-priority-' + (dispatch.priority === 'normal' ? 'medium' : dispatch.priority)">{{ priorityLabel(dispatch.priority) }}</span>
        </div>
        <div style="font-size:13px;font-weight:800;margin-bottom:3px">{{ ds.clientName(dispatch.clientId) }}</div>
        <div class="flow-note">{{ t('dispatch.board.purchaseOrder') }} <span class="mono">{{ dispatch.orderId }}</span></div>
        <div class="flow-row" style="margin-top:10px;flex-wrap:wrap">
          <span :class="coldTypeBadge(dispatch.coldType)">{{ coldTypeLabel(dispatch.coldType) }}</span>
          <span :class="'badge ' + orderStatusBadge(dispatch.status)">{{ orderStatusLabel(dispatch.status) }}</span>
          <span :class="'badge ' + creditFor(dispatch).badgeClass">{{ creditFor(dispatch).statusLabel }}</span>
        </div>
        <div class="divider" style="margin:10px 0"></div>
        <div class="flow-stack" style="gap:6px">
          <div class="flow-row-between dispatch-meta-row">
            <span class="flow-note">{{ t('dispatch.board.businessDocuments') }}</span>
            <strong>{{ dispatch.documentProgress || '0/0' }}</strong>
          </div>
          <div class="flow-row-between dispatch-meta-row">
            <span class="flow-note">{{ t('dispatch.board.route') }}</span>
            <strong>{{ dispatch.routeName }}</strong>
          </div>
          <div class="flow-row-between dispatch-meta-row">
            <span class="flow-note">{{ t('dispatch.board.eta') }}</span>
            <strong>{{ etaLabel(dispatch) }}</strong>
          </div>
          <div class="flow-row-between dispatch-meta-row">
            <span class="flow-note">{{ t('dispatch.board.responsible') }}</span>
            <strong>{{ dispatch.responsible || t('common.unassigned') }}</strong>
          </div>
          <div v-if="creditFor(dispatch).limit" class="flow-row-between dispatch-meta-row">
            <span class="flow-note">{{ t('dispatch.board.clientCredit') }}</span>
            <strong>S/ {{ creditFor(dispatch).available.toLocaleString() }} {{ t('dispatch.board.available') }}</strong>
          </div>
        </div>
        <div v-if="isDelayed(dispatch)" class="banner banner-warning" style="margin:10px 0 0;padding:9px">
          <i class="pi pi-clock"></i>
          <div>{{ dispatch.delayReason || t('dispatch.board.etaReview') }}</div>
        </div>
        <div v-if="dispatch.incidentNote" class="banner banner-danger" style="margin:10px 0 0;padding:9px">
          <i class="pi pi-exclamation-triangle"></i>
          <div>{{ dispatch.incidentNote }}</div>
        </div>
        <div v-else-if="dispatch.status === 'incident'" class="banner banner-danger" style="margin:10px 0 0;padding:9px">
          <i class="pi pi-exclamation-triangle"></i>
          <div>{{ t('dispatch.board.incidentLockedDesc') }}</div>
        </div>
        <button
          class="btn btn-secondary btn-sm"
          style="margin-top:12px;width:100%;justify-content:center"
          :disabled="Boolean(busyDispatchId) || ['incident', 'cancelled', 'rejected', 'delivered'].includes(dispatch.status)"
          :title="dispatch.status === 'incident' ? t('dispatch.board.incidentLockedDesc') : ''"
          @click.stop="moveForward(dispatch)"
        >
          <i :class="busyDispatchId === dispatch.id ? 'pi pi-spin pi-spinner' : 'pi pi-arrow-right'"></i>
          {{ busyDispatchId === dispatch.id ? t('dispatch.board.updating') : dispatch.status === 'incident' ? t('dispatch.board.incidentLocked') : ['cancelled', 'rejected'].includes(dispatch.status) ? t('dispatch.board.returnedToSales') : dispatch.status === 'delivered' ? t('dispatch.deliveredBtn') : t('dispatch.board.moveForward') }}
        </button>
      </article>
    </section>
  </div>
</template>

<style scoped>
.filter-bar {
  align-items: stretch;
}
.dispatch-filter-select {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  max-width: min(100%, 360px);
  padding: 0 12px;
  border: 1px solid #dbe5f2;
  border-radius: 10px;
  background: #fff;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}
.dispatch-filter-select select {
  min-width: 0;
  max-width: 260px;
  border: 0;
  background: transparent;
  color: #0f172a;
  font-weight: 800;
  outline: none;
  text-overflow: ellipsis;
}
.kanban-board {
  grid-template-columns: repeat(5, minmax(228px, 1fr));
}
.dispatch-card {
  padding: 14px;
}
.dispatch-card strong {
  text-align: left;
  overflow-wrap: anywhere;
}
.dispatch-meta-row {
  display: grid;
  grid-template-columns: minmax(82px, 0.55fr) minmax(0, 1fr);
  align-items: start;
  gap: 10px;
}
.dispatch-meta-row .flow-note {
  line-height: 1.35;
}
.dispatch-meta-row strong {
  justify-self: end;
  max-width: 100%;
  color: #0f172a;
  font-size: 12px;
  line-height: 1.35;
  text-align: right;
}
@media (max-width: 720px) {
  .dispatch-filter-select,
  .dispatch-filter-select select {
    width: 100%;
    max-width: 100%;
  }
}
</style>
