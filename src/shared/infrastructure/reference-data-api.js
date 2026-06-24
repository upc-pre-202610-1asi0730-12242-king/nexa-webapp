import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint';
import { baseApi } from '@/shared/infrastructure/base-api';

export class ReferenceDataApi {
  constructor() {
    this.cache = new Map();
  }

  async get(resource) {
    if (this.cache.has(resource)) return this.cache.get(resource);
    const endpoint = new BaseEndpoint(`/api/v1/reference/${resource}`, baseApi, { useCoreBackend: true });
    const rows = await endpoint.getAll();
    this.cache.set(resource, rows);
    return rows;
  }
}

export const referenceDataApi = new ReferenceDataApi();

