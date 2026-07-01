import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint';

class ClientsApiService {
  constructor() {
    this.clients = new BaseEndpoint('/api/v1/clients');
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
}

export const clientsApiService = new ClientsApiService();
