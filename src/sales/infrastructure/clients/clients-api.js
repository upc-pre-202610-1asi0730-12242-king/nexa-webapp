import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint';

class ClientsApiService {
  constructor() {
    this.clients = new BaseEndpoint('/api/v1/client-accounts');
  }

  getClients() {
    return this.clients.getAll();
  }

  getClientById(id) {
    return this.clients.getById(id);
  }

  createClient(client) {
    return this.clients.create(client);
  }

  updateClient(id, client) {
    return this.clients.update(id, client);
  }

  updateCurrentBuyerProfile(client) {
    return this.clients.request((http) =>
      http.put(this.clients.pathFor(http, '', '/api/v1/profile/client-account'), client).then(response => response.data));
  }

  getClientFinancialProfile(id) {
    return this.clients.request((client) =>
      client.get(this.clients.pathFor(client, `/${id}/financial-profile`, '/api/v1/client-accounts')).then(response => response.data));
  }

  getFinancialProfile(id) {
    return this.getClientFinancialProfile(id);
  }
}

export const clientsApiService = new ClientsApiService();
