import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useDataStore } from '@/app/application/stores/data.store';
import { catalogApiService } from '@/catalog-management/infrastructure/product-catalog/catalog-api';

export const useProductCatalogStore = defineStore('productCatalog', () => {
  const dataStore = useDataStore();
  const loading = ref(false);
  const error = ref('');
  const availabilityByProduct = ref({});
  const promotionalCatalog = ref([]);
  const promotionalCatalogPage = ref(null);
  const products = computed(() => dataStore.D.products);
  const buyerVisibleProducts = computed(() => products.value.filter(product => product.visibleToBuyer !== false && product.isVisibleToBuyer !== false));
  const categories = computed(() => dataStore.D.categories);

  async function loadProductAvailability(productId) {
    if (!productId) return null;
    loading.value = true;
    error.value = '';
    try {
      const availability = await catalogApiService.getCatalogItemAvailability(productId);
      availabilityByProduct.value = { ...availabilityByProduct.value, [String(productId)]: availability };
      return availability;
    } catch (err) {
      error.value = err?.message || 'Catalog item availability could not be loaded.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function loadPromotionalCatalog(params = { page: 1, pageSize: 50 }) {
    loading.value = true;
    error.value = '';
    try {
      const result = await catalogApiService.getPromotionalCatalog(params);
      promotionalCatalogPage.value = result;
      promotionalCatalog.value = result?.items || [];
      return result;
    } catch (err) {
      error.value = err?.message || 'Promotional catalog could not be loaded.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function availabilityForProduct(productId) {
    return availabilityByProduct.value[String(productId)] || null;
  }

  return {
    loading,
    error,
    products,
    buyerVisibleProducts,
    categories,
    availabilityByProduct,
    promotionalCatalog,
    promotionalCatalogPage,
    loadProductAvailability,
    loadPromotionalCatalog,
    availabilityForProduct,
  };
});
