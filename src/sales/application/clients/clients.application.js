import { clientsApiService } from '../../infrastructure/clients/clients-api';
import { ClientAssembler } from '../../infrastructure/clients/client.assembler';

const mapClientResource = (client) => ClientAssembler.toResource(ClientAssembler.toEntity(client));

export const clientsApplication = {
  getClients() {
    return clientsApiService.getClients().then(clients => clients.map(mapClientResource));
  },

  getClientById(id) {
    return clientsApiService.getClientById(id).then(mapClientResource);
  },

  createClient(client) {
    return clientsApiService
      .createClient(ClientAssembler.toCreateResource(client))
      .then(mapClientResource);
  },

  updateClient(id, client) {
    return clientsApiService
      .updateClient(id, ClientAssembler.toCreateResource(client))
      .then(mapClientResource);
  },

  updateCurrentBuyerProfile(client) {
    return clientsApiService
      .updateCurrentBuyerProfile(ClientAssembler.toCreateResource(client))
      .then(mapClientResource);
  },

  getActiveClients() {
    return this.getClients().then(clients => clients.filter(c => c.status === 'active'));
  },
};
