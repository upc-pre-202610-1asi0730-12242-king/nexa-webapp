import { Entity } from '@/shared/domain/model/entities/entity';
import { toNumber } from '@/shared/utils/number.utils';

export class Client extends Entity {
  constructor({
    id,
    backendId,
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
    condition = 'cash',
    paymentCondition,
    creditLimit = 0,
    creditUsed = 0,
    monthlyCreditLimit,
    monthlyCreditUsed,
    monthlyCreditAvailable,
    monthlyCreditStatus,
    deliveryPreference,
    portalAccess,
    sellerWorkspaceEmail,
    status = 'active',
    lastOrder = null,
  } = {}) {
    super({ id });
    this.backendId = backendId;
    this.code = code || id;
    this.name = name;
    this.businessName = businessName || name;
    this.commercialName = commercialName || name;
    this.ruc = ruc;
    this.type = type;
    this.segment = segment;
    this.contact = contact;
    this.contactEmail = contactEmail;
    this.phone = phone;
    this.address = address;
    this.condition = condition;
    this.paymentCondition = paymentCondition || condition;
    this.creditLimit = toNumber(creditLimit);
    this.creditUsed = toNumber(creditUsed);
    this.monthlyCreditLimit = toNumber(monthlyCreditLimit ?? creditLimit);
    this.monthlyCreditUsed = toNumber(monthlyCreditUsed ?? creditUsed);
    this.monthlyCreditAvailable = toNumber(monthlyCreditAvailable ?? this.monthlyCreditLimit - this.monthlyCreditUsed);
    this.monthlyCreditStatus = monthlyCreditStatus || 'ok';
    this.deliveryPreference = deliveryPreference;
    this.portalAccess = portalAccess !== false;
    this.sellerWorkspaceEmail = sellerWorkspaceEmail;
    this.status = status;
    this.lastOrder = lastOrder;
  }

  hasCreditLimit() {
    return this.creditLimit > 0;
  }

  availableCredit() {
    return Math.max(this.creditLimit - this.creditUsed, 0);
  }

  isObserved() {
    return this.status === 'observed';
  }

  isCreditExhausted() {
    return this.hasCreditLimit() && this.creditUsed >= this.creditLimit;
  }
}
