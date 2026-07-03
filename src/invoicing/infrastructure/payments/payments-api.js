import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint';
import { baseApi } from '@/shared/infrastructure/base-api';

export class PaymentsApi {
  constructor() {
    this.payments = new BaseEndpoint('/api/v1/payments', baseApi, { useCoreBackend: true });
  }

  getPayments() {
    return this.payments.getAll();
  }

  createPayment(resource) {
    return this.payments.create(resource);
  }

  confirmPayment(id) {
    return this.payments.request((client, endpointPath) =>
      client.post(this.payments.pathFor(client, `/${id}/confirmations`, endpointPath)).then(response => response.data));
  }

  rejectPayment(id, reason = '') {
    return this.payments.request((client, endpointPath) =>
      client.post(this.payments.pathFor(client, `/${id}/rejections`, endpointPath), { reason }).then(response => response.data));
  }
}

export const paymentsApi = new PaymentsApi();
