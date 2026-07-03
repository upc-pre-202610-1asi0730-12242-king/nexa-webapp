export class OrderResource {
  constructor({
    id,
    backendId,
    code,
    clientId,
    clientAccountId,
    customerName,
    status,
    priority,
    date,
    currency,
    items = [],
    total,
    notes,
    delivery,
    paymentConfirmation,
    inventoryReservation,
    rejectionReason,
    confirmedAt,
    createdAt,
    updatedAt,
    source,
  } = {}) {
    this.id = id;
    this.backendId = backendId;
    this.code = code || id;
    this.clientId = clientId;
    this.clientAccountId = clientAccountId;
    this.customerName = customerName;
    this.status = status;
    this.priority = priority;
    this.date = date;
    this.currency = currency;
    this.items = items;
    this.total = total;
    this.notes = notes;
    this.delivery = delivery || {};
    this.paymentConfirmation = paymentConfirmation;
    this.inventoryReservation = inventoryReservation;
    this.rejectionReason = rejectionReason;
    this.confirmedAt = confirmedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.source = source;
  }
}
