export class Tenant {
  constructor({
    id,
    name,
    slug,
    status,
    plan,
    workspaceUrl,
    emailDomain,
    capabilities = [],
    branding = {},
  }) {
    this.id = id;
    this.name = name;
    this.slug = slug;
    this.status = status;
    this.plan = plan;
    this.workspaceUrl = workspaceUrl;
    this.emailDomain = emailDomain;
    this.capabilities = capabilities;
    this.branding = branding;
  }
}
