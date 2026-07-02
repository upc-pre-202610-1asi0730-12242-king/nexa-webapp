<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useDataStore } from '@/app/application/stores/data.store';
import { useDispatchOrdersStore } from '@/logistics/application/dispatch-orders/dispatch-orders.store';
import { orderStatusLabel, orderStatusBadge, coldTypeLabel, coldTypeBadge, documentStatusLabel, documentStatusBadge, displayCode } from '@/shared/status';
import { creditSummary } from '@/shared/credit';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const ds = useDataStore();
const dispatchOrdersStore = useDispatchOrdersStore();
const saving = ref(false);
const actionError = ref('');

const dispatch = computed(() => ds.dispatchOrderById(route.params.id));
const order = computed(() => dispatch.value ? ds.purchaseOrderById(dispatch.value.orderId) : null);
const client = computed(() => dispatch.value ? ds.clientById(dispatch.value.clientId) : null);
const address = computed(() => dispatch.value ? ds.deliveryAddressById(dispatch.value.deliveryAddressId) : null);
const orderDestination = computed(() => {
  const delivery = order.value?.delivery || {};
  const street = [delivery.addressType, delivery.address].filter(Boolean).join(' ');
  return [street, delivery.district, delivery.city, delivery.province].filter(Boolean).join(', ');
});
const docs = computed(() => order.value ? ds.documentsForOrder(order.value.id) : []);
const items = computed(() => order.value ? ds.orderItemsFor(order.value.id) : []);
const dispatchReadModelId = computed(() => dispatch.value ? (dispatch.value.backendId || dispatch.value.id) : null);
const events = computed(() => {
  const readModelEvents = dispatchOrdersStore.eventsForDispatch(dispatchReadModelId.value);
  return readModelEvents.length ? readModelEvents : (order.value ? ds.timelineForOrder(order.value.id) : []);
});
const temps = computed(() => order.value ? ds.temperatureForOrder(order.value.id) : []);
const pod = computed(() => dispatch.value ? ds.D.proofOfDelivery.find(item => item.dispatchOrderId === dispatch.value.id) : null);
const credit = computed(() => creditSummary(client.value || {}));
const temperatureSummary = computed(() => {
  const records = temps.value;
  const alerts = records.filter(log => log.status !== 'ok');
  return {
    total: records.length,
    alerts: alerts.length,
    latest: records[records.length - 1],
  };
});

async function runDispatchAction(status) {
  if (!dispatch.value || saving.value) return;
  saving.value = true;
  actionError.value = '';
  try {
    await ds.updateDispatchStatus(dispatch.value.id, status);
  } catch (error) {
    actionError.value = error?.message || t('dispatch.detailView.actionError');
  } finally {
    saving.value = false;
  }
}

async function completeDeliveryEvidence() {
  if (!dispatch.value || saving.value) return;
  saving.value = true;
  actionError.value = '';
  try {
    await ds.completePod(dispatch.value.id);
  } catch (error) {
    actionError.value = error?.message || t('dispatch.detailView.podError');
  } finally {
    saving.value = false;
  }
}

watch(dispatchReadModelId, (id) => {
  if (id) dispatchOrdersStore.loadDispatchSummary(id).catch(() => {});
}, { immediate: true });
</script>

<template>
  <div v-if="!dispatch" class="empty-state">
    <div class="empty-state-icon"><i class="pi pi-search"></i></div>
    <div class="empty-state-title">{{ t('dispatch.detailView.notFound') }}</div>
    <button class="btn btn-primary" @click="router.push('/ops/operations/dispatch-orders')">{{ t('dispatch.detailView.backToBoard') }}</button>
  </div>

  <template v-else>
    <div class="page-header">
      <div>
        <div class="flow-row" style="margin-bottom:5px">
          <button class="btn btn-ghost btn-sm" @click="router.push('/ops/operations/dispatch-orders')"><i class="pi pi-arrow-left"></i> {{ t('dispatch.detailView.board') }}</button>
          <span class="page-title mono">{{ displayCode(dispatch) }}</span>
          <span :class="'badge ' + orderStatusBadge(dispatch.status)">{{ orderStatusLabel(dispatch.status) }}</span>
          <span :class="coldTypeBadge(dispatch.coldType)">{{ coldTypeLabel(dispatch.coldType) }}</span>
        </div>
        <div class="page-subtitle">{{ ds.clientName(dispatch.clientId) }} - {{ dispatch.routeName || t('dispatch.detailView.routePending') }} - {{ t('dispatch.board.eta') }} {{ dispatch.eta ? new Date(dispatch.eta).toLocaleString('en-US') : t('common.notScheduled') }}</div>
      </div>
      <div class="flow-row">
        <button class="btn btn-secondary" :disabled="saving || ['delivered', 'incident'].includes(dispatch.status)" @click="runDispatchAction('preparing')">
          <i class="pi pi-box"></i> {{ t('dispatch.detailView.process') }}
        </button>
        <button class="btn btn-secondary" :disabled="saving || !['preparing', 'scheduled', 'assigned'].includes(dispatch.status)" @click="runDispatchAction('ready_for_route')">
          <i class="pi pi-check-circle"></i> {{ t('dispatch.detailView.readyRoute') }}
        </button>
        <button class="btn btn-primary" :disabled="saving || dispatch.status !== 'ready_for_route'" @click="runDispatchAction('in_route')">
          <i class="pi pi-send"></i> {{ t('dispatch.detailView.startRoute') }}
        </button>
        <button class="btn btn-secondary" :disabled="saving || dispatch.status !== 'in_route'" @click="runDispatchAction('delivered')">
          <i class="pi pi-flag"></i> {{ t('dispatch.deliveredBtn') }}
        </button>
        <button class="btn btn-danger" :disabled="saving || ['delivered', 'incident'].includes(dispatch.status)" @click="runDispatchAction('incident')">
          <i class="pi pi-exclamation-triangle"></i> {{ t('dispatch.detailView.returnToSales') }}
        </button>
      </div>
    </div>
    <div v-if="actionError" class="banner banner-danger" style="margin-bottom:16px"><i class="pi pi-exclamation-triangle"></i><div>{{ actionError }}</div></div>

    <div class="flow-grid-12">
      <section class="flow-panel span-4">
        <div class="flow-panel-head"><div class="flow-title">{{ t('dispatch.detailView.operationalSummary') }}</div></div>
        <div class="flow-panel-pad flow-stack">
          <div>
            <div class="flow-eyebrow">{{ t('dispatch.detailView.client') }}</div>
            <div style="font-size:15px;font-weight:800">{{ client?.businessName || client?.name }}</div>
            <div class="flow-note">{{ client?.ruc }} - {{ client?.condition }}</div>
          </div>
          <div>
            <div class="flow-eyebrow">{{ t('common.address') }}</div>
            <div style="font-size:13px;font-weight:700">{{ orderDestination || address?.label || client?.address || t('common.notConfigured') }}</div>
            <div v-if="order?.delivery?.reference" class="flow-note">{{ t('common.reference') }}: {{ order.delivery.reference }}</div>
          </div>
          <div class="flow-row-between"><span>{{ t('dispatch.board.purchaseOrder') }}</span><strong class="mono">{{ displayCode(order) }}</strong></div>
          <div class="flow-row-between"><span>{{ t('dispatch.detailView.driver') }}</span><strong>{{ dispatch.driverName }}</strong></div>
          <div class="flow-row-between"><span>{{ t('dispatch.detailView.owner') }}</span><strong>{{ dispatch.responsible }}</strong></div>
          <div class="credit-summary-box">
            <div class="flow-row-between">
              <span>{{ t('dispatch.detailView.creditCondition') }}</span>
              <span :class="'badge ' + credit.badgeClass">{{ credit.statusLabel }}</span>
            </div>
            <template v-if="credit.limit">
              <div class="flow-row-between"><span>{{ t('common.available') }}</span><strong>S/ {{ credit.available.toLocaleString() }}</strong></div>
              <div class="credit-bar-wrap" role="progressbar" :aria-valuenow="credit.percent" aria-valuemin="0" aria-valuemax="100">
                <div class="credit-bar" :style="{ width: credit.percent + '%', background: credit.barColor }"></div>
              </div>
              <div class="flow-note">{{ t('dispatch.detailView.periodDue', { period: credit.period, date: credit.dueDate }) }}</div>
            </template>
            <div class="flow-note">{{ t('dispatch.detailView.logisticsOnly') }}</div>
          </div>
        </div>
      </section>

      <section class="flow-panel span-8">
        <div class="flow-panel-head"><div class="flow-title">{{ t('dispatch.detailView.dispatchItems') }}</div></div>
        <table class="data-table">
          <thead><tr><th>{{ t('inventory.table.product') }}</th><th>{{ t('common.quantity') }}</th><th>{{ t('dispatch.detailView.coldChain') }}</th><th>{{ t('inventory.table.stock') }}</th></tr></thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>
                <div class="dispatch-product-cell">
                  <img
                    v-if="ds.productById(item.productId)?.imageUrl"
                    class="dispatch-product-image"
                    :src="ds.productById(item.productId).imageUrl"
                    :alt="ds.productName(item.productId)"
                    loading="lazy"
                  />
                  <div v-else class="dispatch-product-image dispatch-product-image-empty"><i class="pi pi-box"></i></div>
                  <div>
                    <div style="font-weight:800">{{ ds.productName(item.productId) }}</div>
                    <div class="flow-note">{{ ds.productById(item.productId)?.sku }}</div>
                  </div>
                </div>
              </td>
              <td>{{ item.quantity }} {{ item.unit }} <span class="flow-note">({{ item.estimatedWeightKg }} kg)</span></td>
              <td><span :class="coldTypeBadge(ds.productById(item.productId)?.coldType)">{{ coldTypeLabel(ds.productById(item.productId)?.coldType) }}</span></td>
              <td><span :class="'badge ' + (item.stockOk ? 'badge-green' : 'badge-red')">{{ item.stockOk ? 'OK' : t('dispatch.detailView.partial') }}</span></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="flow-panel span-6">
        <div class="flow-panel-head">
          <div class="flow-title">{{ t('dispatch.detailView.docsBeforeDeparture') }}</div>
        </div>
        <div class="flow-panel-pad">
          <div v-for="doc in docs" :key="doc.id" class="document-check">
            <div>
              <div style="font-weight:800">{{ doc.label }}</div>
              <div class="flow-note">{{ doc.required ? t('dispatch.detailView.required') : t('dispatch.detailView.notRequired') }}</div>
            </div>
            <span :class="'badge ' + documentStatusBadge(doc.status)">{{ documentStatusLabel(doc.status) }}</span>
          </div>
        </div>
      </section>

      <section class="flow-panel span-6">
        <div class="flow-panel-head">
          <div class="flow-title">{{ t('dispatch.detailView.podTemperature') }}</div>
        </div>
        <div class="flow-panel-pad flow-stack">
          <div :class="temperatureSummary.alerts ? 'banner banner-warning' : 'banner banner-success'" style="margin-bottom:0">
            <i :class="temperatureSummary.alerts ? 'pi pi-exclamation-triangle' : 'pi pi-thermometer'"></i>
            <div>
              {{ temperatureSummary.alerts ? t('dispatch.detailView.temperatureReview', { count: temperatureSummary.alerts }) : t('dispatch.detailView.temperatureOk') }}
            </div>
          </div>
          <div :class="pod?.status === 'complete' ? 'banner banner-success' : 'banner banner-warning'" style="margin-bottom:0">
            <i :class="pod?.status === 'complete' ? 'pi pi-check-circle' : 'pi pi-camera'"></i>
            <div>{{ pod?.status === 'complete' ? t('dispatch.detailView.podCompleteMessage') : t('dispatch.detailView.podPendingMessage') }}</div>
          </div>
          <div v-for="log in temps" :key="log.id" class="flow-row-between">
            <span>{{ new Date(log.recordedAt || log.timestamp).toLocaleTimeString('en-US') }}</span>
            <strong :style="{ color: log.status === 'ok' ? '#15803D' : '#B45309' }">{{ log.celsius ?? log.temperatureC }} C - {{ log.status }}</strong>
          </div>
          <button class="btn btn-secondary" :disabled="saving || pod?.status === 'complete'" @click="completeDeliveryEvidence">
            <i class="pi pi-camera"></i> {{ pod?.status === 'complete' ? t('dispatch.detailView.podComplete') : t('dispatch.detailView.completePod') }}
          </button>
        </div>
      </section>

      <section class="flow-panel span-12">
        <div class="flow-panel-head"><div class="flow-title">{{ t('dispatch.detailView.timelineVisible') }}</div></div>
        <div class="flow-panel-pad">
          <div class="timeline">
            <div v-for="event in events" :key="event.id" class="tl-item">
              <div class="tl-spine"></div>
              <div class="tl-dot" style="background:#DBEAFE;color:#1D4ED8"><i class="pi pi-check"></i></div>
              <div class="tl-content">
                <div class="tl-title">{{ event.label }}</div>
                <div class="tl-meta">{{ new Date(event.timestamp).toLocaleString('en-US') }} - {{ event.visibleToBuyer ? t('dispatch.detailView.buyerVisible') : t('dispatch.detailView.internal') }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </template>
</template>

<style scoped>
.dispatch-product-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 220px;
}

.dispatch-product-image {
  width: 54px;
  height: 54px;
  flex: 0 0 54px;
  object-fit: contain;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.dispatch-product-image-empty {
  display: grid;
  place-items: center;
  color: #94a3b8;
  background: #f8fafc;
}
</style>
