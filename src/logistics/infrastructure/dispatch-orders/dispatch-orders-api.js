import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint';
import { baseApi } from '@/shared/infrastructure/base-api';

/**
 * Dispatch orders API service.
 *
 * @summary Provides HTTP operations for dispatch order resources.
 * @class DispatchOrdersApiService
 */
class DispatchOrdersApiService {
  constructor() {
    this.dispatchOrders = new BaseEndpoint('/api/v1/dispatch-orders', baseApi, { useCoreBackend: true });
  }

  /**
   * @summary Gets all dispatch orders.
   * @returns {Promise<Array>}
   */
  getDispatchOrders() {
    return this.dispatchOrders.getAll();
  }

  getDispatchOrderSummary(id) {
    return this.dispatchOrders.request((client, endpointPath) =>
      client.get(this.dispatchOrders.pathFor(client, `/${id}/summary`, endpointPath)).then(response => response.data));
  }

  getDispatchSummary(id) {
    return this.getDispatchOrderSummary(id);
  }

  /**
   * @summary Updates a dispatch order record.
   * @param {string} id - Dispatch identifier.
   * @param {Object} payload - Fields to update.
   * @returns {Promise<Object>}
   */
  updateDispatchOrder(id, payload) {
    return this.dispatchOrders.patch(id, payload);
  }

  assign(id, responsible) {
    return this.dispatchOrders.request((client, endpointPath) =>
      client.post(this.dispatchOrders.pathFor(client, `/${id}/assignees`, endpointPath), { responsible }).then(response => response.data));
  }

  schedule(id, payload) {
    return this.dispatchOrders.request((client, endpointPath) =>
      client.post(this.dispatchOrders.pathFor(client, `/${id}/schedules`, endpointPath), payload).then(response => response.data));
  }

  startRoute(id) {
    return this.dispatchOrders.request((client, endpointPath) =>
      client.post(this.dispatchOrders.pathFor(client, `/${id}/route-starts`, endpointPath)).then(response => response.data));
  }

  registerIncident(id, note) {
    return this.dispatchOrders.request((client, endpointPath) =>
      client.post(this.dispatchOrders.pathFor(client, `/${id}/incidents`, endpointPath), { note }).then(response => response.data));
  }
}

export const dispatchOrdersApiService = new DispatchOrdersApiService();
