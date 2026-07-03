export class ClientResource {
  constructor({
    id,
    backendId,
    tenantId,
    code,
    name,
    businessName,
    commercialName,
    ruc,
    type,
    segment,
    contact,
    contactEmail,
    phone,
    address,
    district,
    province,
    reference,
    documentProfile,
    condition,
    paymentCondition,
    creditLimit,
    creditUsed,
    monthlyCreditLimit,
    monthlyCreditUsed,
    monthlyCreditAvailable,
    monthlyCreditStatus,
    deliveryPreference,
    portalAccess,
    sellerWorkspaceEmail,
    status,
    lastOrder,
  } = {}) {
    this.id = id;
    this.backendId = backendId;
    this.tenantId = tenantId;
    this.code = code;
    this.name = name;
    this.businessName = businessName;
    this.commercialName = commercialName;
    this.ruc = ruc;
    this.type = type;
    this.segment = segment;
    this.contact = contact;
    this.contactEmail = contactEmail;
    this.phone = phone;
    this.address = address;
    this.district = district;
    this.province = province;
    this.reference = reference;
    this.documentProfile = documentProfile;
    this.condition = condition;
    this.paymentCondition = paymentCondition;
    this.creditLimit = creditLimit;
    this.creditUsed = creditUsed;
    this.monthlyCreditLimit = monthlyCreditLimit;
    this.monthlyCreditUsed = monthlyCreditUsed;
    this.monthlyCreditAvailable = monthlyCreditAvailable;
    this.monthlyCreditStatus = monthlyCreditStatus;
    this.deliveryPreference = deliveryPreference;
    this.portalAccess = portalAccess;
    this.sellerWorkspaceEmail = sellerWorkspaceEmail;
    this.status = status;
    this.lastOrder = lastOrder;
  }
}
