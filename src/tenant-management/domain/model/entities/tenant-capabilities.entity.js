export class TenantCapabilities {
  constructor(capabilities = []) {
    this.capabilities = capabilities;
  }

  has(capability) {
    return this.capabilities.includes(capability);
  }
}
