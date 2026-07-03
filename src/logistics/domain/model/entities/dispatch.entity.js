import { Entity } from '@/shared/domain/model/entities/entity';
import { DispatchStatus } from '../value-objects/dispatch-status.value-object';
import { PodEvidenceReference } from '../value-objects/pod-evidence-reference.value-object';

export class Dispatch extends Entity {
  constructor({
    id,
    orderId,
    clientId,
    status = 'ready',
    driver,
    vehicle,
    dest,
    tempExit = null,
    evidenceRequired = false,
    evidenceDone = false,
    checklist = [],
    tenantId = null,
    backendId = null,
    code = null,
    orderBackendId = null,
    column = null,
    priority = 'normal',
    routeName = '',
    eta = null,
    driverName = '',
    responsible = '',
    requiresPOD = false,
    documentProgress = '',
    coldType = 'chilled',
    lastTemperatureCelsius = null,
    scheduledAt = null,
    deliveredAt = null,
    createdAt = null,
    updatedAt = null,
  } = {}) {
    super({ id });
    this.tenantId = tenantId;
    this.backendId = backendId;
    this.code = code || id;
    this.orderId = orderId;
    this.orderBackendId = orderBackendId;
    this.clientId = clientId;
    this.status = new DispatchStatus(status);
    this.column = column || status;
    this.priority = priority;
    this.driver = driver;
    this.driverName = driverName || driver;
    this.vehicle = vehicle;
    this.dest = dest;
    this.tempExit = tempExit;
    this.evidenceRequired = Boolean(evidenceRequired);
    this.evidenceDone = Boolean(evidenceDone);
    this.checklist = checklist;
    this.routeName = routeName;
    this.eta = eta;
    this.responsible = responsible;
    this.requiresPOD = Boolean(requiresPOD || evidenceRequired);
    this.documentProgress = documentProgress;
    this.coldType = coldType;
    this.lastTemperatureCelsius = lastTemperatureCelsius;
    this.scheduledAt = scheduledAt;
    this.deliveredAt = deliveredAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  canStartRoute() {
    return this.status.value === 'ready' && this.checklist.length > 0;
  }

  needsPodEvidence() {
    return this.evidenceRequired && !this.evidenceDone;
  }

  closeDelivery(evidence = {}) {
    const podEvidence = evidence instanceof PodEvidenceReference ? evidence : new PodEvidenceReference(evidence);
    if (this.evidenceRequired && !podEvidence.isComplete()) {
      throw new Error('POD evidence is required to close delivery');
    }

    this.status = new DispatchStatus('delivered');
    this.evidenceDone = true;
  }
}
