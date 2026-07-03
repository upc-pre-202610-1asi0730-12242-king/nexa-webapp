import { Client } from '../../domain/model/entities/client.entity';
import { ClientResource } from './client.resource';

const valueOf = (resource, camel, pascal = null, fallback = undefined) =>
  resource?.[camel] ?? resource?.[pascal || camel[0].toUpperCase() + camel.slice(1)] ?? fallback;

const numberOf = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const ClientAssembler = {
  toEntity(resource) {
    if (!resource) return null;
    const normalized = this.normalizeResource(resource);
    return new Client(normalized);
  },

  toResource(entity) {
    if (!entity) return null;
    const normalized = this.normalizeResource(entity);
    return new ClientResource({
      ...normalized,
    });
  },

  toEntities(resources = []) {
    return resources.map((r) => this.toEntity(r));
  },

  normalizeResource(resource = {}) {
    const backendId = valueOf(resource, 'backendId', 'BackendId', valueOf(resource, 'id'));
    const tenantId = valueOf(resource, 'tenantId', 'TenantId', null);
    const code = valueOf(resource, 'code', 'Code', valueOf(resource, 'id'));
    const businessName = valueOf(resource, 'businessName', 'BusinessName', valueOf(resource, 'name', 'Name', ''));
    const commercialName = valueOf(resource, 'commercialName', 'CommercialName', valueOf(resource, 'name', 'Name', businessName));
    const monthlyCreditLimit = numberOf(valueOf(resource, 'monthlyCreditLimit', 'MonthlyCreditLimit', valueOf(resource, 'creditLimit', 'CreditLimit', 0)));
    const monthlyCreditUsed = numberOf(valueOf(resource, 'monthlyCreditUsed', 'MonthlyCreditUsed', valueOf(resource, 'creditUsed', 'CreditUsed', 0)));

    return {
      id: code,
      backendId: Number.isFinite(Number(backendId)) ? Number(backendId) : backendId,
      tenantId: Number.isFinite(Number(tenantId)) ? Number(tenantId) : tenantId,
      code,
      name: commercialName || businessName,
      businessName,
      commercialName,
      ruc: valueOf(resource, 'ruc', 'Ruc', ''),
      type: valueOf(resource, 'type', 'Type', 'B2B Buyer'),
      segment: valueOf(resource, 'segment', 'Segment', valueOf(resource, 'type', 'Type', 'Gourmet / refrigerated')),
      contact: valueOf(resource, 'contact', 'Contact', ''),
      contactEmail: valueOf(resource, 'contactEmail', 'ContactEmail', valueOf(resource, 'email', 'Email', '')),
      phone: valueOf(resource, 'phone', 'Phone', ''),
      address: valueOf(resource, 'address', 'Address', ''),
      district: valueOf(resource, 'district', 'District', ''),
      province: valueOf(resource, 'province', 'Province', ''),
      reference: valueOf(resource, 'deliveryReference', 'DeliveryReference', valueOf(resource, 'reference', 'Reference', '')),
      documentProfile: valueOf(resource, 'documentProfile', 'DocumentProfile', 'ruc_factura_xml_pdf_guia'),
      condition: valueOf(resource, 'condition', 'Condition', valueOf(resource, 'paymentCondition', 'PaymentCondition', 'credit_15')),
      paymentCondition: valueOf(resource, 'paymentCondition', 'PaymentCondition', valueOf(resource, 'condition', 'Condition', 'credit_15')),
      creditLimit: monthlyCreditLimit,
      creditUsed: monthlyCreditUsed,
      monthlyCreditLimit,
      monthlyCreditUsed,
      monthlyCreditAvailable: numberOf(
        valueOf(resource, 'monthlyCreditAvailable', 'MonthlyCreditAvailable'),
        Math.max(0, monthlyCreditLimit - monthlyCreditUsed)
      ),
      monthlyCreditStatus: valueOf(resource, 'monthlyCreditStatus', 'MonthlyCreditStatus', valueOf(resource, 'creditStatus', 'CreditStatus', 'ok')),
      deliveryPreference: valueOf(resource, 'deliveryPreference', 'DeliveryPreference', 'Morning cold-chain window'),
      portalAccess: valueOf(resource, 'portalAccess', 'PortalAccess', true) !== false,
      sellerWorkspaceEmail: valueOf(resource, 'sellerWorkspaceEmail', 'SellerWorkspaceEmail', ''),
      status: valueOf(resource, 'status', 'Status', 'active'),
      lastOrder: valueOf(resource, 'lastOrder', 'LastOrder', null),
    };
  },

  toCreateResource(entity = {}) {
    const resource = this.normalizeResource(entity);
    return {
      code: resource.code || resource.id,
      businessName: resource.businessName,
      commercialName: resource.commercialName,
      ruc: resource.ruc,
      segment: resource.segment,
      contact: resource.contact,
      contactEmail: resource.contactEmail,
      phone: resource.phone,
      address: resource.address,
      district: resource.district,
      province: resource.province,
      deliveryReference: resource.reference,
      documentProfile: resource.documentProfile,
      paymentCondition: resource.paymentCondition,
      monthlyCreditLimit: resource.monthlyCreditLimit,
      monthlyCreditUsed: resource.monthlyCreditUsed,
      monthlyCreditStatus: resource.monthlyCreditStatus,
      deliveryPreference: resource.deliveryPreference,
      portalAccess: resource.portalAccess,
      sellerWorkspaceEmail: resource.sellerWorkspaceEmail,
      status: resource.status,
    };
  },
};
