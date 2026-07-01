<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useDataStore } from '@/app/application/stores/data.store';
import { ORDER_STATUS_FILTERS, orderStatusLabel, orderStatusBadge, priorityLabel, displayCode } from '@/shared/status';

const { t } = useI18n();
const router = useRouter();
const ds = useDataStore();
const D = ds.D;
const FILTER_STORAGE_KEY = 'nexa.sales.purchase-orders.filters';
function readSavedFilters() {
  try {
    return JSON.parse(localStorage.getItem(FILTER_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}
const savedFilters = readSavedFilters();

const search = ref(savedFilters.search || '');
const filter = ref(savedFilters.filter || 'all');
const sortKey = ref(savedFilters.sortKey || 'date');
const sortDir = ref(savedFilters.sortDir || 'desc');
const statusKeys = ORDER_STATUS_FILTERS;

watch([search, filter, sortKey, sortDir], () => {
  localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({
    search: search.value,
    filter: filter.value,
    sortKey: sortKey.value,
    sortDir: sortDir.value,
  }));
});

const sourceOrders = computed(() => D.purchaseOrders.length ? D.purchaseOrders : D.orders);

const filtered = computed(() => {
  let arr = sourceOrders.value;
  if (filter.value !== 'all') arr = arr.filter(o => o.status === filter.value);
  if (search.value) {
    const q = search.value.toLowerCase();
    arr = arr.filter(o => displayCode(o).toLowerCase().includes(q) || ds.clientName(o.clientId).toLowerCase().includes(q));
  }
  return [...arr].sort((a, b) => compareOrder(a, b));
});

function sortBy(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  else {
    sortKey.value = key;
    sortDir.value = key === 'date' ? 'desc' : 'asc';
  }
}

function sortIndicator(key) {
  if (sortKey.value !== key) return 'pi-sort-alt';
  return sortDir.value === 'asc' ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down';
}

function compareOrder(a, b) {
  const key = sortKey.value;
  const values = {
    order: [displayCode(a), displayCode(b)],
    client: [ds.clientName(a.clientId), ds.clientName(b.clientId)],
    date: [a.date || a.createdAt || '', b.date || b.createdAt || ''],
    total: [Number(a.total || 0), Number(b.total || 0)],
    status: [orderStatusLabel(a.status), orderStatusLabel(b.status)],
    priority: [priorityLabel(a.priority), priorityLabel(b.priority)],
  }[key] || ['', ''];
  const result = typeof values[0] === 'number'
    ? values[0] - values[1]
    : String(values[0]).localeCompare(String(values[1]), undefined, { numeric: true, sensitivity: 'base' });
  return sortDir.value === 'asc' ? result : -result;
}
</script>

<template>
  <div class="page-header" role="banner">
    <div>
      <div class="page-title">{{ t('nav.orders') }}</div>
      <div class="page-subtitle">{{ sourceOrders.length }} {{ t('orders.subtitle') }}</div>
    </div>
    <button class="btn btn-primary" @click="router.push('/ops/commercial/manual-order-entry')">
      <i class="pi pi-plus" aria-hidden="true"></i> {{ t('nav.createOrder') }}
    </button>
  </div>

  <div class="filter-bar" role="toolbar" :aria-label="'Purchase order filters'">
    <div class="search-input">
      <i class="pi pi-search" aria-hidden="true"></i>
      <input v-model="search" :placeholder="t('orders.searchPlaceholder')" :aria-label="t('orders.searchPlaceholder')" />
    </div>
    <button class="filter-chip" :class="{ active: filter === 'all' }" @click="filter = 'all'" :aria-pressed="filter === 'all'">{{ t('common.all') }}</button>
    <button
      v-for="s in statusKeys"
      :key="s"
      class="filter-chip"
      :class="{ active: filter === s }"
      @click="filter = s"
      :aria-pressed="filter === s"
    >{{ orderStatusLabel(s) }}</button>
  </div>

  <div class="card" style="overflow:hidden">
    <table class="data-table" role="table" :aria-label="t('nav.orders')">
      <thead>
        <tr>
          <th scope="col"><button class="table-sort" type="button" @click="sortBy('order')">{{ t('orders.table.order') }} <i :class="'pi ' + sortIndicator('order')"></i></button></th>
          <th scope="col"><button class="table-sort" type="button" @click="sortBy('client')">{{ t('orders.table.client') }} <i :class="'pi ' + sortIndicator('client')"></i></button></th>
          <th scope="col"><button class="table-sort" type="button" @click="sortBy('date')">{{ t('orders.table.date') }} <i :class="'pi ' + sortIndicator('date')"></i></button></th>
          <th scope="col"><button class="table-sort" type="button" @click="sortBy('total')">{{ t('orders.table.total') }} <i :class="'pi ' + sortIndicator('total')"></i></button></th>
          <th scope="col"><button class="table-sort" type="button" @click="sortBy('status')">{{ t('orders.table.status') }} <i :class="'pi ' + sortIndicator('status')"></i></button></th>
          <th scope="col"><button class="table-sort" type="button" @click="sortBy('priority')">{{ t('orders.table.priority') }} <i :class="'pi ' + sortIndicator('priority')"></i></button></th>
          <th scope="col"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="o in filtered" :key="o.id" style="cursor:pointer" @click="router.push(`/ops/commercial/purchase-orders/${o.id}`)">
          <td><span class="mono">{{ displayCode(o) }}</span></td>
          <td>
            <div style="font-weight:500;font-size:13px">{{ ds.clientName(o.clientId) }}</div>
            <div style="font-size:11px;color:#9CA3AF">{{ ds.clientById(o.clientId)?.type || ds.clientById(o.clientId)?.segment }}</div>
          </td>
          <td style="font-size:12px;color:#6B7280">{{ o.date }}</td>
          <td style="font-weight:600;font-size:13px">S/ {{ o.total.toFixed(2) }}</td>
          <td><span :class="'badge ' + orderStatusBadge(o.status)">{{ orderStatusLabel(o.status) }}</span></td>
          <td><span :class="'badge-priority-' + o.priority">{{ priorityLabel(o.priority) }}</span></td>
          <td><button class="btn btn-ghost btn-sm">{{ t('common.view') }}</button></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-sort {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  padding: 0;
}
.table-sort i {
  font-size: 11px;
  color: #94a3b8;
}
</style>
