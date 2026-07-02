<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useDataStore } from '@/app/application/stores/data.store';
import OrderTimeline from '@/logistics/presentation/delivery-tracking/components/order-timeline.vue';

const route = useRoute();
const { t } = useI18n();
const ds = useDataStore();
const order = computed(() => ds.purchaseOrderById(route.params.id) || {});
const events = computed(() => ds.timelineForOrder(order.value.id));
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ order.code || order.id || t('tracking.title') }}</h1>
        <p class="page-subtitle">{{ t('tracking.subtitle') }}</p>
      </div>
    </div>
    <order-timeline :order="order" :events="events" />
  </div>
</template>
