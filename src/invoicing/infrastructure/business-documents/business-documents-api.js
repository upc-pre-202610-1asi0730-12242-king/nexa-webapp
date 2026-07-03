import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint';
import { baseApi } from '@/shared/infrastructure/base-api';

export class BusinessDocumentsApi {
  constructor() {
    this.documents = new BaseEndpoint('/api/v1/business-documents', baseApi, { useCoreBackend: true });
    this.payments = new BaseEndpoint('/api/v1/payments', baseApi, { useCoreBackend: true });
  }

  getDocuments() { return this.documents.getAll().then(documents => documents.map(document => this.resourceToDocument(document))); }
  getPayments() { return this.payments.getAll(); }
  patchDocument(id, payload) { return this.documents.patch(id, payload); }
  generate(payload) {
    return this.documents.request((client, endpointPath) =>
      client.post(this.documents.pathFor(client, '/generations', endpointPath), payload)
        .then(response => response.data)
    );
  }
  downloadContent(id) {
    return this.documents.request((client, endpointPath) =>
      client.get(this.documents.pathFor(client, `/${id}/content`, endpointPath), { responseType: 'blob' })
        .then(response => ({
          blob: response.data,
          contentDisposition: response.headers['content-disposition'] || '',
        }))
    );
  }

  resourceToDocument(document = {}) {
    return {
      id: document.code || `DOC-${document.id}`,
      backendId: document.id,
      orderId: document.orderId,
      clientId: document.clientAccountId || document.clientId,
      type: document.type || 'business_document',
      label: document.label || 'Business document',
      status: document.status || 'pending',
      required: document.required !== false,
      visibleToBuyer: Boolean(document.visibleToBuyer),
      fileName: document.fileName || '',
      amount: Number(document.amount || document.total || 0),
      currency: document.currency || 'PEN',
      paymentStatus: document.paymentStatus || document.status,
      paidAt: document.paidAt,
      source: 'nexa-platform',
    };
  }
}
