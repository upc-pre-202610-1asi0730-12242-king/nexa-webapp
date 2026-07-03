import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useDataStore } from '@/app/application/stores/data.store';
import { purchaseOrdersApiService } from '@/sales/infrastructure/purchase-orders/purchase-orders-api';

export const usePurchaseOrdersStore = defineStore('purchaseOrders', () => {
  const dataStore = useDataStore();
  const loading = ref(false);
  const error = ref('');
  const orderSummaries = ref([]);
  const orderSummaryPage = ref(null);
  const orderTimelines = ref({});
  const orders = computed(() => dataStore.D.purchaseOrders);
  const summaryRows = computed(() => orderSummaries.value.map(summary => ({
    id: summary.id,
    backendId: summary.id,
    code: summary.orderNumber,
    orderNumber: summary.orderNumber,
    status: summary.status,
    clientId: summary.client?.id,
    clientName: summary.client?.commercialName || summary.client?.businessName || summary.client?.code,
    total: Number(summary.total || 0),
    date: summary.createdAt,
    createdAt: summary.createdAt,
    requestedDeliveryDate: summary.requestedDeliveryDate,
    dispatchStatus: summary.dispatchStatus,
    paymentStatus: summary.paymentStatus,
    itemCount: summary.itemCount,
    priority: 'normal',
  })));
  const blockedOrders = computed(() => orders.value.filter(order => ['pending', 'blocked', 'document_pending', 'validating'].includes(order.status)));

  function findById(id) {
    return dataStore.purchaseOrderById(id);
  }

  async function loadOrderSummaries(params = { page: 1, pageSize: 50 }) {
    loading.value = true;
    error.value = '';
    try {
      const result = await purchaseOrdersApiService.getSalesOrderSummaries(params);
      orderSummaryPage.value = result;
      orderSummaries.value = result?.items || [];
      return result;
    } catch (err) {
      error.value = err?.message || 'Sales order summaries could not be loaded.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function loadOrderTimeline(orderId) {
    if (!orderId) return null;
    loading.value = true;
    error.value = '';
    try {
      const timeline = await purchaseOrdersApiService.getOrderTimeline(orderId);
      orderTimelines.value = { ...orderTimelines.value, [String(orderId)]: timeline };
      return timeline;
    } catch (err) {
      error.value = err?.message || 'Order timeline could not be loaded.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function timelineForOrder(orderId) {
    return (orderTimelines.value[String(orderId)]?.events || []).map((event, index) => ({
      id: `${event.source}-${index}`,
      orderId,
      status: event.status,
      label: event.description,
      timestamp: event.occurredAt,
      visibleToBuyer: true,
    }));
  }

  return {
    loading,
    error,
    orders,
    orderSummaries,
    orderSummaryPage,
    summaryRows,
    orderTimelines,
    blockedOrders,
    findById,
    loadOrderSummaries,
    loadOrderTimeline,
    timelineForOrder,
  };
});
