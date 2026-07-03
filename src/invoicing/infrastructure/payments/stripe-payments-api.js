import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint';
import { baseApi } from '@/shared/infrastructure/base-api';

export class StripePaymentsApi {
  constructor() {
    this.stripePayments = new BaseEndpoint('/api/v1/payments/stripe', baseApi, { useCoreBackend: true });
  }

  createCheckoutSession(resource) {
    return this.stripePayments.request((client, endpointPath) =>
      client.post(this.stripePayments.pathFor(client, '/checkout-sessions', endpointPath), resource)
        .then(response => response.data));
  }

  createPaymentIntent(resource) {
    return this.stripePayments.request((client, endpointPath) =>
      client.post(this.stripePayments.pathFor(client, '/payment-intents', endpointPath), resource)
        .then(response => response.data));
  }
}

export const stripePaymentsApi = new StripePaymentsApi();
