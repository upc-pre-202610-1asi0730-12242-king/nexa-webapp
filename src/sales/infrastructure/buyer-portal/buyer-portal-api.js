import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint';
import { baseApi } from '@/shared/infrastructure/base-api';

export class BuyerPortalApi {
  constructor() {
    this.clients = new BaseEndpoint('/api/v1/client-accounts', baseApi);
    this.requests = new BaseEndpoint('/api/v1/purchase-requests', baseApi);
    this.orders = new BaseEndpoint('/api/v1/orders', baseApi, { useCoreBackend: true });
    this.documents = new BaseEndpoint('/api/v1/business-documents', baseApi, { useCoreBackend: true });
  }

  getClients() { return this.clients.getAll(); }
  getRequests() { return this.requests.getAll(); }
  getOrders() { return this.orders.getAll(); }
  getDocuments() { return this.documents.getAll(); }
  getBuyerDashboardSummary() {
    return this.orders.request((client) =>
      client.get(this.orders.pathFor(client, '', '/api/v1/buyer/dashboard-summary')).then(response => response.data));
  }
  getBuyerOrderLifecycle(id) {
    return this.orders.request((client) =>
      client.get(this.orders.pathFor(client, `/${id}/lifecycle`, '/api/v1/buyer/orders')).then(response => response.data));
  }
  getBuyerFinancialProfile() {
    return this.orders.request((client) =>
      client.get(this.orders.pathFor(client, '', '/api/v1/buyer/financial-profile')).then(response => response.data));
  }
  getDashboardSummary() { return this.getBuyerDashboardSummary(); }
  getOrderLifecycle(id) { return this.getBuyerOrderLifecycle(id); }
  getFinancialProfile() { return this.getBuyerFinancialProfile(); }
}
