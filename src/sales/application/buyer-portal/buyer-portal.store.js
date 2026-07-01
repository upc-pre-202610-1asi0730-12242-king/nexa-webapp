import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useAuthStore } from '@/iam/application/iam.store';
import { useDataStore } from '@/app/application/stores/data.store';
import { BuyerPortalApi } from '@/sales/infrastructure/buyer-portal/buyer-portal-api';

export const useBuyerPortalStore = defineStore('buyerPortal', () => {
  const auth = useAuthStore();
  const dataStore = useDataStore();
  const api = new BuyerPortalApi();
  const loading = ref(false);
  const error = ref('');
  const dashboardSummary = ref(null);
  const financialProfile = ref(null);
  const orderLifecycles = ref({});

  const buyerClientId = computed(() => auth.user?.clientId || null);
  const buyerClient = computed(() => buyerClientId.value ? dataStore.clientById(buyerClientId.value) : null);
  const buyerRequests = computed(() => dataStore.D.purchaseRequests.filter(request => request.clientId === buyerClientId.value));
  const buyerOrders = computed(() => dataStore.D.purchaseOrders.filter(order => order.clientId === buyerClientId.value));
  const buyerDocuments = computed(() =>
    buyerOrders.value.flatMap(order => dataStore.documentsForOrder(order.id).filter(document => document.visibleToBuyer))
  );

  async function loadDashboardSummary() {
    loading.value = true;
    error.value = '';
    try {
      dashboardSummary.value = await api.getBuyerDashboardSummary();
      return dashboardSummary.value;
    } catch (err) {
      error.value = err?.message || 'Buyer dashboard summary could not be loaded.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function loadFinancialProfile() {
    loading.value = true;
    error.value = '';
    try {
      financialProfile.value = await api.getBuyerFinancialProfile();
      return financialProfile.value;
    } catch (err) {
      error.value = err?.message || 'Buyer financial profile could not be loaded.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function loadOrderLifecycle(orderId) {
    if (!orderId) return null;
    loading.value = true;
    error.value = '';
    try {
      const lifecycle = await api.getBuyerOrderLifecycle(orderId);
      orderLifecycles.value = { ...orderLifecycles.value, [String(orderId)]: lifecycle };
      return lifecycle;
    } catch (err) {
      error.value = err?.message || 'Buyer order lifecycle could not be loaded.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function lifecycleForOrder(orderId) {
    return orderLifecycles.value[String(orderId)] || null;
  }

  function lifecycleEventsForOrder(orderId) {
    const lifecycle = lifecycleForOrder(orderId);
    return (lifecycle?.dispatchEvents || []).map(event => ({
      id: event.id,
      orderId,
      status: event.status,
      label: event.description,
      timestamp: event.createdAt,
      visibleToBuyer: event.visibleToBuyer,
    }));
  }

  return {
    loading,
    error,
    dashboardSummary,
    financialProfile,
    orderLifecycles,
    buyerClientId,
    buyerClient,
    buyerRequests,
    buyerOrders,
    buyerDocuments,
    loadDashboardSummary,
    loadFinancialProfile,
    loadOrderLifecycle,
    lifecycleForOrder,
    lifecycleEventsForOrder,
  };
});
