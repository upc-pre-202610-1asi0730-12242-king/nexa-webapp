import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useDataStore } from '@/app/application/stores/data.store';
import { dispatchOrdersApiService } from '@/logistics/infrastructure/dispatch-orders/dispatch-orders-api';

export const useDispatchOrdersStore = defineStore('dispatchOrders', () => {
  const dataStore = useDataStore();
  const loading = ref(false);
  const error = ref('');
  const summaries = ref({});
  const dispatchOrders = computed(() => dataStore.D.dispatchOrders);

  function move(dispatchId, status) {
    return dataStore.updateDispatchStatus(dispatchId, status);
  }

  async function loadDispatchSummary(dispatchId) {
    if (!dispatchId) return null;
    loading.value = true;
    error.value = '';
    try {
      const summary = await dispatchOrdersApiService.getDispatchOrderSummary(dispatchId);
      summaries.value = { ...summaries.value, [String(dispatchId)]: summary };
      return summary;
    } catch (err) {
      error.value = err?.message || 'Dispatch summary could not be loaded.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function summaryForDispatch(dispatchId) {
    return summaries.value[String(dispatchId)] || null;
  }

  function eventsForDispatch(dispatchId) {
    return (summaryForDispatch(dispatchId)?.events || []).map(event => ({
      id: event.id,
      dispatchOrderId: dispatchId,
      orderId: summaryForDispatch(dispatchId)?.linkedOrder?.id,
      status: event.status,
      label: event.description,
      timestamp: event.createdAt,
      visibleToBuyer: event.visibleToBuyer,
    }));
  }

  return {
    loading,
    error,
    dispatchOrders,
    summaries,
    move,
    loadDispatchSummary,
    summaryForDispatch,
    eventsForDispatch,
  };
});
