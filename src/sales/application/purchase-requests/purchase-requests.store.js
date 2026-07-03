import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useDataStore } from '@/app/application/stores/data.store';
import { PurchaseRequestsApi } from '@/sales/infrastructure/purchase-requests/purchase-requests-api';

export const usePurchaseRequestsStore = defineStore('purchaseRequests', () => {
  const dataStore = useDataStore();
  const api = new PurchaseRequestsApi();
  const loading = ref(false);
  const error = ref('');
  const inbox = ref([]);
  const inboxPage = ref(null);
  const requests = computed(() => dataStore.D.purchaseRequests);
  const pendingRequests = computed(() => requests.value.filter(request => ['submitted', 'in_review', 'needs_adjustment'].includes(request.status)));

  function findById(id) {
    return dataStore.purchaseRequestById(id);
  }

  async function loadSalesInbox(params = { page: 1, pageSize: 50 }) {
    loading.value = true;
    error.value = '';
    try {
      const result = await api.getSalesInbox(params);
      inboxPage.value = result;
      inbox.value = result?.items || [];
      return result;
    } catch (err) {
      error.value = err?.message || 'Sales purchase request inbox could not be loaded.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, requests, pendingRequests, inbox, inboxPage, findById, loadSalesInbox };
});
