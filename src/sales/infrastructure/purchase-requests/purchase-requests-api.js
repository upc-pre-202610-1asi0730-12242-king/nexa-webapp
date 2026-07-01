import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint';

export class PurchaseRequestsApi {
  constructor() {
    this.requests = new BaseEndpoint('/api/v1/purchase-requests');
    this.items = new BaseEndpoint('/api/v1/purchase-request-lines');
  }

  getRequests() { return this.requests.getAll(); }
  createRequest(payload) { return this.requests.create(payload); }
  patchRequest(id, payload) { return this.requests.patch(id, payload); }
  getItems() { return this.items.getAll(); }
  submit(id, note) { return this.requests.request((client, endpointPath) => client.post(this.requests.pathFor(client, `/${id}/submissions`, endpointPath), { note }).then(response => response.data)); }
  cancel(id, note) { return this.requests.request((client, endpointPath) => client.post(this.requests.pathFor(client, `/${id}/cancellations`, endpointPath), { note }).then(response => response.data)); }
  requestAdjustment(id, note) { return this.requests.request((client, endpointPath) => client.post(this.requests.pathFor(client, `/${id}/adjustment-requests`, endpointPath), { note }).then(response => response.data)); }
  reject(id, note) { return this.requests.request((client, endpointPath) => client.post(this.requests.pathFor(client, `/${id}/rejections`, endpointPath), { note }).then(response => response.data)); }
  validateCommercially(id, payload) { return this.requests.request((client, endpointPath) => client.post(this.requests.pathFor(client, `/${id}/commercial-validations`, endpointPath), payload).then(response => response.data)); }
  accept(id, note) { return this.requests.request((client, endpointPath) => client.post(this.requests.pathFor(client, `/${id}/acceptances`, endpointPath), { note }).then(response => response.data)); }
  sendMessage(id, payload) { return this.requests.request((client, endpointPath) => client.post(this.requests.pathFor(client, `/${id}/messages`, endpointPath), payload).then(response => response.data)); }
  getSalesInbox(params = {}) {
    return this.requests.request((client) =>
      client.get(this.requests.pathFor(client, '', '/api/v1/sales/purchase-request-inbox'), { params }).then(response => response.data));
  }
}
