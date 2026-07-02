<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/iam/application/iam.store';
import { useDataStore } from '@/app/application/stores/data.store';
import { documentStatusLabel, documentStatusBadge, displayCode } from '@/shared/status';

const router = useRouter();
const { t } = useI18n();
const auth = useAuthStore();
const ds = useDataStore();

const docs = computed(() =>
  ds.D.businessDocuments
    .filter(doc => ds.clientRecordMatches(doc, auth.user?.clientId) && (doc.visibleToBuyer || doc.required))
    .sort((a, b) => a.orderId.localeCompare(b.orderId))
);
const visibleDocs = computed(() => docs.value.filter(doc => doc.visibleToBuyer));
</script>

<template>
  <div class="page-header">
    <div>
      <div class="page-title">{{ t('portal.nav.documents') }}</div>
      <div class="page-subtitle">{{ visibleDocs.length }} {{ t('common.download') }}. {{ t('dispatch.evidencePending') }}</div>
    </div>
  </div>

  <section class="flow-panel">
    <table class="data-table">
      <thead><tr><th>{{ t('dispatch.board.purchaseOrder') }}</th><th>{{ t('common.documents') }}</th><th>{{ t('common.status') }}</th><th>{{ t('dispatch.detailView.buyerVisible') }}</th><th>{{ t('common.view') }}</th></tr></thead>
      <tbody>
        <tr v-for="doc in docs" :key="doc.id">
          <td><span class="mono">{{ displayCode(ds.purchaseOrderById(doc.orderId)) }}</span></td>
          <td>
            <div style="font-weight:800">{{ doc.label }}</div>
            <div class="flow-note">{{ doc.fileName }}</div>
          </td>
          <td><span :class="'badge ' + documentStatusBadge(doc.status)">{{ documentStatusLabel(doc.status) }}</span></td>
          <td>{{ doc.visibleToBuyer ? t('common.yes') : t('common.pending') }}</td>
          <td>
            <div class="flow-row">
              <button class="btn btn-secondary btn-sm" :disabled="!doc.visibleToBuyer">{{ t('common.download') }}</button>
              <button class="btn btn-ghost btn-sm" @click="router.push('/portal/purchase-orders/' + doc.orderId)">{{ t('nav.tracking') }}</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
