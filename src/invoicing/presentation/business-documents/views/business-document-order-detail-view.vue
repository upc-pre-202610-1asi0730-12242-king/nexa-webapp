<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useDataStore } from '@/app/application/stores/data.store';
import { displayCode, documentStatusBadge, documentStatusLabel, orderStatusBadge, orderStatusLabel } from '@/shared/status';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const ds = useDataStore();
const requiredTypes = ['factura_xml', 'factura_pdf', 'guia_pdf'];
const activeKey = ref('');
const actionError = ref('');

const order = computed(() => ds.purchaseOrderById(route.params.orderId));
const client = computed(() => order.value ? ds.clientById(order.value.clientId) : null);
const items = computed(() => order.value ? ds.orderItemsFor(order.value.id) : []);
const documents = computed(() => requiredTypes.map(type => ({
  type,
  document: order.value
    ? ds.D.businessDocuments.find(row => row.orderId === order.value.id && row.type === type)
    : null,
})));
const readyCount = computed(() => documents.value.filter(row => ['ready', 'uploaded', 'accepted'].includes(row.document?.status)).length);
const deliveryDate = computed(() => order.value?.delivery?.requestedDate || order.value?.requestedDeliveryDate || t('common.pending'));
const deliveryAddress = computed(() => {
  const delivery = order.value?.delivery || {};
  const street = [delivery.addressType, delivery.address].filter(Boolean).join(' ');
  return [street, delivery.district, delivery.province, delivery.city].filter(Boolean).join(', ') || t('common.addressPending');
});
const backPath = computed(() => route.path.includes('/operations/')
  ? '/ops/operations/business-documents'
  : '/ops/commercial/business-documents');

function typeLabel(type) {
  return t(`businessDocuments.types.${type}`);
}

function actionLabel(type, exists) {
  if (exists) return t('businessDocuments.detail.regenerateFile');
  return type === 'factura_xml'
    ? t('businessDocuments.detail.generateInvoiceXml')
    : type === 'factura_pdf'
      ? t('businessDocuments.detail.generateInvoicePdf')
      : t('businessDocuments.detail.generateGuidePdf');
}

async function generate(type) {
  if (!order.value || activeKey.value) return;
  activeKey.value = type;
  actionError.value = '';
  try {
    await ds.generateBusinessDocument({ orderId: order.value.id, type });
  } catch (error) {
    actionError.value = error?.response?.data?.message || error?.message || t('businessDocuments.errors.generate');
  } finally {
    activeKey.value = '';
  }
}

async function download(document) {
  if (!document || activeKey.value) return;
  activeKey.value = document.type;
  actionError.value = '';
  try {
    const result = await ds.downloadBusinessDocument(document.id);
    const url = URL.createObjectURL(result.blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = document.fileName || `${document.type}.${document.type.endsWith('xml') ? 'xml' : 'pdf'}`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    actionError.value = error?.response?.data?.message || error?.message || t('businessDocuments.detail.contentUnavailable');
  } finally {
    activeKey.value = '';
  }
}
</script>

<template>
  <div v-if="!order" class="empty-state">
    <div class="empty-state-icon"><i class="pi pi-folder-open"></i></div>
    <div class="empty-state-title">{{ t('businessDocuments.detail.orderNotFound') }}</div>
    <button class="btn btn-primary" type="button" @click="router.push(backPath)">{{ t('businessDocuments.detail.back') }}</button>
  </div>

  <div v-else>
    <div class="page-header">
      <div>
        <button class="btn btn-ghost btn-sm detail-back" type="button" @click="router.push(backPath)"><i class="pi pi-arrow-left"></i> {{ t('businessDocuments.title') }}</button>
        <div class="page-title">{{ t('businessDocuments.detail.orderDocuments', { code: displayCode(order) }) }}</div>
        <div class="page-subtitle">{{ t('businessDocuments.detail.subtitle', { client: client?.commercialName || client?.businessName }) }}</div>
      </div>
      <span :class="'badge ' + orderStatusBadge(order.status)">{{ orderStatusLabel(order.status) }}</span>
    </div>

    <div v-if="actionError" class="banner banner-danger"><i class="pi pi-exclamation-triangle"></i><div>{{ actionError }}</div></div>

    <section class="document-detail-hero">
      <div><span>{{ t('businessDocuments.detail.readiness') }}</span><strong>{{ readyCount }}/{{ requiredTypes.length }}</strong><small>{{ t('businessDocuments.detail.requiredDocuments') }}</small></div>
      <div><span>{{ t('businessDocuments.detail.orderTotal') }}</span><strong>S/ {{ Number(order.total || order.totalAmount || 0).toFixed(2) }}</strong><small>{{ t('businessDocuments.detail.productLines', { count: items.length }) }}</small></div>
      <div><span>{{ t('businessDocuments.detail.delivery') }}</span><strong>{{ deliveryDate }}</strong><small>{{ deliveryAddress }}</small></div>
    </section>

    <section class="document-detail-grid">
      <article v-for="row in documents" :key="row.type" class="document-detail-card">
        <header>
          <span class="document-type-icon"><i :class="row.type === 'factura_xml' ? 'pi pi-code' : 'pi pi-file-pdf'"></i></span>
          <span :class="'badge ' + documentStatusBadge(row.document?.status || 'missing')">{{ documentStatusLabel(row.document?.status || 'missing') }}</span>
        </header>
        <div>
          <h2>{{ typeLabel(row.type) }}</h2>
          <p>{{ row.document?.fileName || t('businessDocuments.detail.generateHelp') }}</p>
        </div>
        <dl>
          <div><dt>{{ t('clients.table.client') }}</dt><dd>{{ client?.commercialName || client?.businessName }}</dd></div>
          <div><dt>{{ t('orders.table.order') }}</dt><dd class="mono">{{ displayCode(order) }}</dd></div>
          <div><dt>{{ t('businessDocuments.detail.buyerVisibility') }}</dt><dd>{{ row.document?.visibleToBuyer ? t('common.enabled') : t('businessDocuments.detail.afterGeneration') }}</dd></div>
        </dl>
        <footer>
          <button class="btn btn-primary" type="button" :disabled="Boolean(activeKey)" @click="generate(row.type)">
            <i :class="activeKey === row.type ? 'pi pi-spin pi-spinner' : 'pi pi-cog'"></i> {{ actionLabel(row.type, Boolean(row.document?.fileName)) }}
          </button>
          <button class="btn btn-secondary" type="button" :disabled="!row.document?.fileName || Boolean(activeKey)" @click="download(row.document)">
            <i class="pi pi-download"></i> {{ t('common.download') }}
          </button>
        </footer>
      </article>
    </section>

    <section class="flow-panel order-lines-panel">
      <div class="flow-panel-head"><div><div class="flow-title">{{ t('businessDocuments.detail.sourceData') }}</div><div class="flow-subtitle">{{ t('businessDocuments.detail.sourceDataDesc') }}</div></div></div>
      <div class="flow-panel-pad order-line-grid">
        <div v-for="item in items" :key="item.id" class="mini-row"><span>{{ item.itemName || ds.productName(item.productId) }}</span><strong>{{ item.quantity || item.qty }} · S/ {{ Number(item.subtotal || item.price || 0).toFixed(2) }}</strong></div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.detail-back { margin:0 0 8px; padding-left:0; }
.document-detail-hero { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-bottom:18px; }
.document-detail-hero > div { display:grid; gap:5px; min-width:0; padding:16px; border:1px solid #dbe5f2; border-radius:8px; background:#fff; }
.document-detail-hero span { color:#64748b; font-size:11px; font-weight:800; text-transform:uppercase; }
.document-detail-hero strong { color:#0f172a; font-size:22px; }
.document-detail-hero small { color:#64748b; overflow-wrap:anywhere; }
.document-detail-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin-bottom:18px; }
.document-detail-card { display:grid; gap:16px; min-width:0; padding:18px; border:1px solid #dbe5f2; border-radius:8px; background:#fff; }
.document-detail-card header,.document-detail-card footer { display:flex; justify-content:space-between; gap:10px; align-items:center; flex-wrap:wrap; }
.document-type-icon { display:grid; place-items:center; width:42px; height:42px; border-radius:8px; background:#eff6ff; color:#1d4ed8; font-size:20px; }
.document-detail-card h2 { margin:0 0 6px; color:#0f172a; font-size:17px; }
.document-detail-card p { min-height:42px; margin:0; color:#64748b; line-height:1.45; overflow-wrap:anywhere; }
.document-detail-card dl { display:grid; gap:9px; margin:0; }
.document-detail-card dl div { display:flex; justify-content:space-between; gap:12px; padding-bottom:8px; border-bottom:1px solid #edf2f7; }
.document-detail-card dt { color:#64748b; font-size:11px; font-weight:800; }
.document-detail-card dd { margin:0; color:#334155; font-size:11px; font-weight:800; text-align:right; }
.document-detail-card footer .btn { flex:1; justify-content:center; }
.order-line-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
@media (max-width:1040px){ .document-detail-grid { grid-template-columns:1fr; } }
@media (max-width:760px){ .document-detail-hero,.order-line-grid { grid-template-columns:1fr; } }
</style>

