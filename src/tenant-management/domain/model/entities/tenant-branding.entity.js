export class TenantBranding {
  constructor({ displayName, logoPreview = null, primaryColor = '#1d4ed8' }) {
    this.displayName = displayName;
    this.logoPreview = logoPreview;
    this.primaryColor = primaryColor;
  }
}

