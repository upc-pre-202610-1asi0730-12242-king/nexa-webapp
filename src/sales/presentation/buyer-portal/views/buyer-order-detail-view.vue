<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/iam/application/iam.store';
import { useDataStore } from '@/app/application/stores/data.store';
import { useBuyerPortalStore } from '@/sales/application/buyer-portal/buyer-portal.store';
import { orderStatusLabel, orderStatusBadge, buildOrderTrackingSteps, documentStatusLabel, documentStatusBadge, coldTypeLabel, coldTypeBadge, displayCode, effectiveOrderStatus } from '@/shared/status';
import { formatAddress } from '@/shared/utils/address.utils';

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const auth = useAuthStore();
const ds = useDataStore();
const buyerPortal = useBuyerPortalStore();
const downloadingDocumentId = ref(null);
const documentError = ref('');

const order = computed(() => {
  const found = ds.purchaseOrderById(route.params.id);
  return ds.clientRecordMatches(found, auth.user?.clientId) ? found : null;
});
const dispatch = computed(() => order.value ? ds.dispatchForOrder(order.value.id) : null);
const address = computed(() => order.value ? ds.deliveryAddressById(order.value.deliveryAddressId) : null);
const docs = computed(() => order.value ? ds.documentsForOrder(order.value.id).filter(doc => doc.visibleToBuyer || doc.required) : []);
const items = computed(() => order.value ? ds.orderItemsFor(order.value.id) : []);
const orderReadModelId = computed(() => order.value ? (order.value.backendId || order.value.id) : null);
const events = computed(() => {
  if (!order.value) return [];
  const readModelEvents = buyerPortal.lifecycleEventsForOrder(orderReadModelId.value);
  return readModelEvents.length ? readModelEvents : ds.lifecycleEventsForOrder(order.value.id);
});
const temps = computed(() => order.value ? ds.temperatureForOrder(order.value.id).filter(log => log.visibleToBuyer) : []);
const visibleEvents = computed(() => events.value);
const trackedOrder = computed(() => {
  if (!order.value) return null;
  const dispatchStatus = dispatch.value?.status || dispatch.value?.column;
  return { ...order.value, status: effectiveOrderStatus(order.value.status, dispatchStatus) };
});
const steps = computed(() => trackedOrder.value ? buildOrderTrackingSteps(trackedOrder.value, visibleEvents.value) : []);
const deliveryAddressText = computed(() => {
  const delivery = order.value?.delivery || {};
  const street = [delivery.addressType, delivery.address].filter(Boolean).join(' ');
  return formatAddress(street, delivery.district, delivery.city, delivery.province) || address.value?.address || dispatch.value?.routeName || '';
});
const warehouse = computed(() => ds.D.warehouses.find(item =>
  String(item.name || '').includes('ICISA Lima Cold Hub') ||
  String(item.location || item.address || '').includes('Guillermo Dansey')
) || null);
const warehouseOrigin = computed(() => warehouse.value
  ? [warehouse.value.name, warehouse.value.address || warehouse.value.location, 'Peru'].filter(Boolean).join(', ')
  : '');
const mapReady = computed(() => Boolean(warehouseOrigin.value && deliveryAddressText.value));
const encodedWarehouseOrigin = computed(() => encodeURIComponent(warehouseOrigin.value));
const encodedDeliveryAddress = computed(() => encodeURIComponent(`${deliveryAddressText.value}, Peru`));
const mapEmbedUrl = computed(() => mapReady.value ? `https://maps.google.com/maps?saddr=${encodedWarehouseOrigin.value}&daddr=${encodedDeliveryAddress.value}&output=embed` : '');
const mapDirectionsUrl = computed(() => `https://www.google.com/maps/dir/?api=1&origin=${encodedWarehouseOrigin.value}&destination=${encodedDeliveryAddress.value}&travelmode=driving`);
const localeCode = computed(() => locale.value === 'es' ? 'es-PE' : 'en-US');

function formatDateTime(value) {
  return new Date(value).toLocaleString(localeCode.value);
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString(localeCode.value);
}

async function downloadDocument(document) {
  if (!document.fileName || downloadingDocumentId.value) return;
  downloadingDocumentId.value = document.id;
  documentError.value = '';
  try {
    const { blob, contentDisposition } = await ds.downloadBusinessDocument(document.id);
    const headerName = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)/i)?.[1];
    const extension = document.type?.endsWith('_xml') ? 'xml' : 'pdf';
    const fileName = headerName ? decodeURIComponent(headerName) : `${document.type}.${extension}`;
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    documentError.value = error?.message || t('portal.orderDetail.downloadFailed');
  } finally {
    downloadingDocumentId.value = null;
  }
}

watch(orderReadModelId, (id) => {
  if (id) buyerPortal.loadOrderLifecycle(id).catch(() => {});
}, { immediate: true });
</script>

<template>
  <div v-if="!order" class="empty-state">
    <div class="empty-state-icon"><i class="pi pi-search"></i></div>
    <div class="empty-state-title">{{ t('portal.orderDetail.notAvailable') }}</div>
    <button class="btn btn-primary" @click="router.push('/portal/purchase-orders')">{{ t('portal.nav.orders') }}</button>
  </div>

  <template v-else>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">
      <button class="btn btn-ghost btn-sm" @click="router.push('/portal/purchase-orders')"><i class="pi pi-arrow-left"></i> {{ t('portal.orderDetail.purchaseOrders') }}</button>
      <div style="flex:1">
        <div class="flow-row">
          <span class="page-title mono">{{ displayCode(order) }}</span>
          <span :class="'badge ' + orderStatusBadge(trackedOrder.status)">{{ orderStatusLabel(trackedOrder.status) }}</span>
        </div>
        <div class="page-subtitle">{{ t('portal.orderDetail.delivery') }} {{ order.requestedDeliveryDate }} - {{ dispatch?.routeName || t('portal.orderList.notAssigned') }}</div>
      </div>
    </div>

    <section class="buyer-shell-band" style="margin-bottom:18px">
      <div style="position:relative;z-index:1">
        <div class="buyer-title">{{ orderStatusLabel(trackedOrder.status) }}</div>
        <div class="buyer-subtitle" style="margin-top:8px">
          {{ deliveryAddressText || t('portal.orderDetail.addressNotConfigured') }}.
          {{ t('portal.orderDetail.statusSource') }}
        </div>
      </div>
    </section>

    <div class="flow-grid-12">
      <section class="flow-panel span-12">
        <div class="flow-panel-head"><div class="flow-title">{{ t('portal.orderDetail.timeline') }}</div></div>
        <div class="flow-panel-pad">
          <div class="flow-timeline-horizontal">
            <div v-for="step in steps" :key="step.key" class="flow-track-step" :class="step.state">
              <div class="flow-track-index">{{ step.index }}</div>
              <div class="flow-track-label">{{ step.label }}</div>
              <div class="flow-track-date">{{ step.dateLabel }}</div>
            </div>
          </div>
        </div>
      </section>

      <section class="flow-panel span-6">
        <div class="flow-panel-head"><div class="flow-title">{{ t('portal.products') }}</div></div>
        <table class="data-table">
          <thead><tr><th>{{ t('orderDetail.product') }}</th><th>{{ t('portal.orderDetail.coldChain') }}</th><th>{{ t('orderDetail.quantity') }}</th></tr></thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>
                <div class="buyer-order-product">
                  <img v-if="ds.productById(item.productId)?.imageUrl" :src="ds.productById(item.productId).imageUrl" :alt="ds.productName(item.productId)" loading="lazy" />
                  <span v-else class="buyer-order-product-empty"><i class="pi pi-box"></i></span>
                  <div>
                    <div style="font-weight:800">{{ ds.productName(item.productId) }}</div>
                    <div class="flow-note">{{ ds.productById(item.productId)?.sku }}</div>
                  </div>
                </div>
              </td>
              <td><span :class="coldTypeBadge(ds.productById(item.productId)?.coldType)">{{ coldTypeLabel(ds.productById(item.productId)?.coldType) }}</span></td>
              <td>{{ item.quantity }} {{ item.unit }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="flow-panel span-6">
        <div class="flow-panel-head">
          <div class="flow-title">{{ t('portal.orderDetail.documents') }}</div>
        </div>
        <div class="flow-panel-pad">
          <div v-for="doc in docs" :key="doc.id" class="document-check">
            <div>
              <div style="font-weight:800">{{ doc.label }}</div>
              <div class="flow-note">{{ doc.fileName }}</div>
            </div>
            <div class="flow-row">
              <span :class="'badge ' + documentStatusBadge(doc.status)">{{ documentStatusLabel(doc.status) }}</span>
              <button class="btn btn-secondary btn-sm" :disabled="!doc.visibleToBuyer || !doc.fileName || downloadingDocumentId === doc.id" @click="downloadDocument(doc)">
                {{ downloadingDocumentId === doc.id ? t('portal.orderDetail.downloading') : t('portal.orderDetail.download') }}
              </button>
            </div>
          </div>
        </div>
        <div v-if="documentError" class="banner banner-danger" style="margin:0 16px 16px">{{ documentError }}</div>
      </section>

      <section class="flow-panel span-6">
        <div class="flow-panel-head"><div class="flow-title">{{ t('portal.orderDetail.visibleEvents') }}</div></div>
        <div class="flow-panel-pad">
          <div class="timeline">
            <div v-for="event in visibleEvents" :key="event.id" class="tl-item">
              <div class="tl-spine"></div>
              <div class="tl-dot" style="background:#DBEAFE;color:#1D4ED8"><i class="pi pi-check"></i></div>
              <div class="tl-content">
                <div class="tl-title">{{ event.label }}</div>
                <div class="tl-meta">{{ formatDateTime(event.timestamp) }}</div>
              </div>
            </div>
            <div v-if="!visibleEvents.length" class="empty-state compact">{{ t('portal.orderDetail.noVisibleEvents') }}</div>
          </div>
        </div>
      </section>

      <section class="flow-panel span-6">
        <div class="flow-panel-head">
          <div class="flow-title">{{ t('portal.orderDetail.mapTemperature') }}</div>
          <a v-if="mapReady" class="btn btn-secondary btn-sm" :href="mapDirectionsUrl" target="_blank" rel="noopener noreferrer"><i class="pi pi-external-link"></i> {{ t('portal.orderDetail.openMap') }}</a>
        </div>
        <div class="flow-panel-pad flow-stack">
          <div v-if="mapReady" class="route-preview-box">
            <iframe title="Nexa registered delivery route" :src="mapEmbedUrl" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
            <div class="route-preview-meta">
              <span><i class="pi pi-warehouse"></i> {{ warehouse.name }}</span>
              <span><i class="pi pi-map-marker"></i> {{ deliveryAddressText }}</span>
            </div>
          </div>
          <div class="banner banner-info" style="margin-bottom:0">
            <i class="pi pi-map"></i>
            <div>{{ t('portal.orderDetail.mapDescription') }}</div>
          </div>
          <div v-for="log in temps" :key="log.id" class="flow-row-between">
            <span>{{ formatTime(log.timestamp) }}</span>
            <strong>{{ log.temperatureC }} C - {{ log.status }}</strong>
          </div>
        </div>
      </section>
    </div>
  </template>
</template>

<style scoped>
.buyer-order-product {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 210px;
}

.buyer-order-product img,
.buyer-order-product-empty {
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  object-fit: contain;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.buyer-order-product-empty {
  display: grid;
  place-items: center;
  color: #94a3b8;
  background: #f8fafc;
}
</style>
