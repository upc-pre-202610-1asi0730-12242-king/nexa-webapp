<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useDataStore } from '@/app/application/stores/data.store';
import { orderStatusLabel, orderStatusBadge, displayCode } from '@/shared/status';

const router = useRouter();
const { t } = useI18n();
const ds = useDataStore();
const D = ds.D;

const rows = computed(() =>
  D.dispatchOrders.map(dispatch => ({
    dispatch,
    pod: D.proofOfDelivery.find(item => item.dispatchOrderId === dispatch.id),
    order: ds.purchaseOrderById(dispatch.orderId),
  }))
);
const pendingRows = computed(() => rows.value.filter(row => row.pod?.status !== 'complete'));
const completedRows = computed(() => rows.value.filter(row => row.pod?.status === 'complete'));
const savingDispatchId = ref('');
const actionError = ref('');

async function completeEvidence(row) {
  if (row.pod?.status === 'complete' || savingDispatchId.value) return;
  savingDispatchId.value = row.dispatch.id;
  actionError.value = '';
  try {
    await ds.completePod(row.dispatch.id);
  } catch (error) {
    actionError.value = error?.message || t('dispatch.detailView.podError');
  } finally {
    savingDispatchId.value = '';
  }
}
</script>

<template>
  <div class="page-header">
    <div>
      <div class="page-title">{{ t('dispatch.board.proofOfDelivery') }}</div>
      <div class="page-subtitle">{{ t('dispatch.detailView.podPendingMessage') }}</div>
    </div>
  </div>

  <div class="grid-3" style="margin-bottom:18px">
    <div class="card kpi-card">
      <div class="kpi-label"><i class="pi pi-camera" style="color:#F59E0B"></i> {{ t('common.pending') }}</div>
      <div class="kpi-value" style="color:#F59E0B">{{ pendingRows.length }}</div>
      <div class="kpi-sub">{{ t('dispatch.evidencePending') }}</div>
    </div>
    <div class="card kpi-card">
      <div class="kpi-label"><i class="pi pi-check" style="color:#16A34A"></i> {{ t('dispatch.detailView.podComplete') }}</div>
      <div class="kpi-value" style="color:#16A34A">{{ completedRows.length }}</div>
      <div class="kpi-sub">{{ t('dispatch.detailView.buyerVisible') }}</div>
    </div>
    <div class="card kpi-card">
      <div class="kpi-label"><i class="pi pi-truck" style="color:#2563EB"></i> {{ t('nav.dispatch') }}</div>
      <div class="kpi-value" style="color:#2563EB">{{ D.dispatchOrders.length }}</div>
      <div class="kpi-sub">{{ t('dispatch.board.title') }}</div>
    </div>
  </div>

  <div v-if="actionError" class="banner banner-danger">
    <i class="pi pi-exclamation-triangle"></i>
    <div>{{ actionError }}</div>
  </div>

  <section class="evidence-section">
    <div class="flow-panel-head">
      <div>
        <div class="flow-title">{{ t('dispatch.board.proofOfDelivery') }}</div>
        <div class="flow-subtitle">{{ t('dispatch.detailView.podCompleteMessage') }}</div>
      </div>
    </div>
    <div v-if="!rows.length" class="empty-state">
      <div class="empty-state-icon"><i class="pi pi-camera"></i></div>
      <div class="empty-state-title">{{ t('common.noRecords') }}</div>
      <div class="empty-state-desc">{{ t('dispatch.detailView.backToBoard') }}</div>
    </div>
    <div v-else class="evidence-grid">
      <article v-for="row in rows" :key="row.dispatch.id" class="evidence-card">
        <header>
          <div>
            <span class="meta-label">{{ ds.clientName(row.dispatch.clientId) }}</span>
            <strong class="mono">{{ displayCode(row.dispatch) }}</strong>
          </div>
          <span :class="'badge ' + (row.pod?.status === 'complete' ? 'badge-green' : 'badge-amber')">
            <i :class="row.pod?.status === 'complete' ? 'pi pi-check-circle' : 'pi pi-clock'"></i>
            {{ row.pod?.status === 'complete' ? t('dispatch.detailView.podComplete') : t('dispatch.evidencePending') }}
          </span>
        </header>

        <div class="evidence-meta">
          <div><span>{{ t('dispatch.board.purchaseOrder') }}</span><strong class="mono">{{ displayCode(row.order) }}</strong></div>
          <div><span>{{ t('dispatch.board.route') }}</span><strong>{{ row.dispatch.routeName || t('dispatch.detailView.routePending') }}</strong></div>
          <div><span>{{ t('common.status') }}</span><strong :class="'badge ' + orderStatusBadge(row.dispatch.status)">{{ orderStatusLabel(row.dispatch.status) }}</strong></div>
        </div>

        <div class="evidence-checks">
          <span :class="{ complete: row.pod?.photoReference }"><i class="pi pi-camera"></i> {{ t('dispatch.detailView.deliveryPhoto') }}</span>
          <span :class="{ complete: row.pod?.signatureReference }"><i class="pi pi-pencil"></i> {{ t('dispatch.detailView.receiverSignature') }}</span>
          <span :class="{ complete: row.pod?.receivedBy }"><i class="pi pi-user"></i> {{ t('dispatch.detailView.receiverIdentity') }}</span>
        </div>

        <footer>
          <button class="btn btn-secondary btn-sm" type="button" @click="router.push('/ops/operations/dispatch-orders/' + row.dispatch.id)">{{ t('common.viewDetails') }}</button>
          <button
            class="btn btn-primary btn-sm"
            type="button"
            :disabled="row.pod?.status === 'complete' || savingDispatchId === row.dispatch.id"
            :title="row.pod?.status === 'complete' ? t('dispatch.detailView.podCompleteMessage') : ''"
            @click="completeEvidence(row)"
          >
            <i :class="savingDispatchId === row.dispatch.id ? 'pi pi-spin pi-spinner' : 'pi pi-check'"></i>
            {{ row.pod?.status === 'complete' ? t('dispatch.detailView.podComplete') : t('dispatch.detailView.completePod') }}
          </button>
        </footer>
      </article>
    </div>
  </section>
</template>

<style scoped>
.evidence-section { display:grid; gap:14px; }
.evidence-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
.evidence-card { display:grid; gap:16px; min-width:0; padding:18px; border:1px solid #dbe5f2; border-radius:8px; background:#fff; }
.evidence-card header,.evidence-card footer { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.evidence-card header > div { display:grid; gap:5px; }
.evidence-card header strong { color:#0f172a; font-size:16px; }
.evidence-meta { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
.evidence-meta div { display:grid; gap:5px; padding:11px; border:1px solid #e8eef7; border-radius:8px; background:#f8fafc; }
.evidence-meta span { color:#64748b; font-size:10px; font-weight:800; text-transform:uppercase; }
.evidence-meta strong { min-width:0; overflow-wrap:anywhere; color:#334155; font-size:12px; }
.evidence-checks { display:flex; gap:8px; flex-wrap:wrap; }
.evidence-checks span { display:flex; align-items:center; gap:6px; padding:7px 9px; border:1px solid #e2e8f0; border-radius:8px; color:#64748b; font-size:11px; font-weight:800; }
.evidence-checks span.complete { border-color:#bbf7d0; background:#f0fdf4; color:#15803d; }
.evidence-card footer { align-items:center; border-top:1px solid #edf2f7; padding-top:14px; }
@media (max-width:980px){ .evidence-grid { grid-template-columns:1fr; } }
@media (max-width:620px){ .evidence-meta { grid-template-columns:1fr; } .evidence-card footer .btn { flex:1; justify-content:center; } }
</style>

