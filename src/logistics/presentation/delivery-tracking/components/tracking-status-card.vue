<script setup>
import { useI18n } from 'vue-i18n';
import { orderStatusBadge, orderStatusLabel } from '@/shared/status';

defineProps({ order: { type: Object, default: () => ({}) } });
const { t } = useI18n();
</script>

<template>
  <section class="flow-panel">
    <div class="meta-label">{{ t('tracking.status') }}</div>
    <h2 style="margin-top:6px">{{ order.code || order.id }}</h2>
    <span :class="'badge ' + orderStatusBadge(order.status)">{{ orderStatusLabel(order.status) }}</span>
  </section>
</template>
