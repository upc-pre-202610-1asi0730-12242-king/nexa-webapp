import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint';
import { baseApi } from '@/shared/infrastructure/base-api';

/**
 * Catalog API service.
 *
 * @summary Provides HTTP operations for catalog resources.
 * @class CatalogApiService
 */
class CatalogApiService {
  constructor() {
    this.products = new BaseEndpoint('/api/v1/catalog-items', baseApi, {
      useCoreBackend: true,
    });
    this.categories = new BaseEndpoint('/api/v1/categories');
    this.brands = new BaseEndpoint('/api/v1/brands');
  }

  /**
   * @summary Gets all products.
   * @returns {Promise<Array>} Products collection.
   */
  getProducts() {
    return this.products.getAll();
  }

  /**
   * @summary Gets a single product by ID.
   * @param {string} id - Product identifier.
   * @returns {Promise<Object>} Product.
   */
  getProductById(id) {
    return this.products.getById(id);
  }

  getCatalogItemAvailability(id) {
    return this.products.request((client, endpointPath) =>
      client.get(this.products.pathFor(client, `/${id}/availability`, endpointPath)).then(response => response.data));
  }

  getProductAvailability(id) {
    return this.getCatalogItemAvailability(id);
  }

  getPromotionalCatalog(params = {}) {
    return this.products.request((client) =>
      client.get(this.products.pathFor(client, '', '/api/v1/catalog/promotional-catalog'), { params }).then(response => response.data));
  }

  /**
   * @summary Gets all categories.
   * @returns {Promise<Array>} Categories collection.
   */
  getCategories() {
    return this.categories.getAll();
  }

  getBrands() {
    return this.brands.getAll();
  }
}

export const catalogApiService = new CatalogApiService();
