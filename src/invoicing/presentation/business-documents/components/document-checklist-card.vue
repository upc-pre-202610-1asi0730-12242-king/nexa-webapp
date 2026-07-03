<script setup>
import { useI18n } from 'vue-i18n';
import DocumentStatusBadge from './document-status-badge.vue';

defineProps({ documents: { type: Array, default: () => [] } });
const { t } = useI18n();
</script>

<template>
  <section class="flow-panel">
    <div class="flow-panel-head">
      <div>
        <h2>{{ t('businessDocuments.checklist') }}</h2>
        <p>{{ t('businessDocuments.checklistDesc') }}</p>
      </div>
    </div>
    <div class="flow-stack">
      <div v-for="document in documents" :key="document.id" class="mini-row">
        <span>{{ document.label }}</span>
        <document-status-badge :status="document.status" />
      </div>
    </div>
  </section>
</template>
