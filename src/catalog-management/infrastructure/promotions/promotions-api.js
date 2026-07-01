import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint';

export class PromotionsApi {
  constructor() {
    this.promotions = new BaseEndpoint('/api/v1/promotions');
  }

  getPromotions() { return this.promotions.getAll(); }
  createPromotion(payload) { return this.promotions.create(payload); }
  patchPromotion(id, payload) { return this.promotions.patch(id, payload); }
  activate(id) { return this.promotions.request((client, endpointPath) => client.post(this.promotions.pathFor(client, `/${id}/activations`, endpointPath)).then(response => response.data)); }
  deactivate(id) { return this.promotions.request((client, endpointPath) => client.post(this.promotions.pathFor(client, `/${id}/deactivations`, endpointPath)).then(response => response.data)); }
}
