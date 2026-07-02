import { defineStore } from 'pinia';
import { ref } from 'vue';
import { catalogApplication } from '@/catalog-management/application/product-catalog/catalog.application';
import { purchaseOrdersApplication } from '@/sales/application/purchase-orders/purchase-orders.application';
import { clientsApplication } from '@/sales/application/clients/clients.application';
import { inventoryApplication } from '@/warehouse/application/inventory-control/inventory.application';
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint';
import { dispatchOrdersApplication } from '@/logistics/application/dispatch-orders/dispatch-orders.application';
import { BusinessDocumentsApi } from '@/invoicing/infrastructure/business-documents/business-documents-api';
import { paymentsApi } from '@/invoicing/infrastructure/payments/payments-api';
import { tenantApi } from '@/tenant-management/infrastructure/tenant-api';
import { PurchaseRequestsApi } from '@/sales/infrastructure/purchase-requests/purchase-requests-api';

const endpoints = {
  tenants: '/api/v1/tenants',
  subscriptions: '/api/v1/subscriptions',
  users: '/api/v1/users',
  clients: '/api/v1/client-accounts',
  categories: '/api/v1/categories',
  brands: '/api/v1/brands',
  promotions: '/api/v1/promotions',
  warehouses: '/api/v1/warehouses',
  stockMovements: '/api/v1/inventory-movements',
  purchaseRequests: '/api/v1/purchase-requests',
  requestItems: '/api/v1/purchase-request-lines',
  orderTimelineEvents: '/api/v1/dispatch-events',
  businessDocuments: '/api/v1/business-documents',
  dispatchOrders: '/api/v1/dispatch-orders',
  deliveryEvents: '/api/v1/dispatch-events',
  proofOfDelivery: '/api/v1/proof-of-delivery-records',
  messages: '/api/v1/conversation-messages',
  paymentMethods: '/api/v1/payment-method-records',
  payments: '/api/v1/payments',
  creditRequests: '/api/v1/credit-requests',
  creditPayments: '/api/v1/payments',
  notifications: '/api/v1/notifications',
  temperatureLogs: '/api/v1/temperature-logs',
  auditLogs: '/api/v1/audit-logs',
};

const api = Object.fromEntries(
  Object.entries(endpoints).map(([key, path]) => [
    key,
    new BaseEndpoint(path)
  ])
);

/**
 * Central store for runtime data.
 * Loads business data from configured Nexa platform services by bounded context.
 */
export const useDataStore = defineStore('data', () => {
  const loading = ref(false);
  const loadError = ref('');
  const collectionErrors = ref({});
  const D = ref({
    company:   { id: '', name: '', legalName: '', ruc: '', address: '', country: '', emailDomain: '', subscriptionPlan: 'standard' },
    user:      { name: '', role: '', initials: '', email: '' },
    tenants: [],
    subscriptions: [],
    roles: [],
    users: [],
    warehouses: [],
    products:  [],
    categories: [],
    brands: [],
    productImages: [],
    priceLists: [],
    promotions: [],
    lots:      [],
    inventoryLots: [],
    movements: [],
    stockMovements: [],
    availabilitySnapshots: [],
    clients:   [],
    clientContacts: [],
    deliveryAddresses: [],
    orders:    [],
    purchaseRequests: [],
    requestItems: [],
    purchaseOrders: [],
    orderItems: [],
    orderTimelineEvents: [],
    businessDocuments: [],
    dispatchOrders: [],
    dispatchItems: [],
    deliveryEvents: [],
    proofOfDelivery: [],
    chatThreads: [],
    messages: [],
    paymentMethods: [],
    payments: [],
    creditRequests: [],
    creditPayments: [],
    notifications: [],
    temperatureLogs: [],
    alerts:    [],
    activity:  [],
    activityLog: [],
    supportConversations: [],
    premiumAccess: [],
    companyAdminUsers: [],
  });

  function clientName(id)  {
    const client = D.value.clients.find(c => c.id === id) || {};
    return client.commercialName || client.name || client.businessName || id;
  }
  function productName(id) { return (D.value.products.find(p => p.id === id) || {}).name || id; }
  function productById(id) {
    const key = String(id);
    return D.value.products.find(p =>
      String(p.id) === key ||
      String(p.productId) === key ||
      String(p.sku) === key ||
      String(p.catalogItemId) === key ||
      String(p.backendId) === key
    );
  }
  function clientById(id) {
    const key = String(id ?? '');
    return D.value.clients.find(c =>
      String(c.id) === key ||
      String(c.backendId) === key ||
      String(c.code) === key
    );
  }
  function clientRecordMatches(record, clientId) {
    if (!record || clientId === null || clientId === undefined || clientId === '') return false;
    const client = clientById(clientId);
    const keys = [clientId, client?.id, client?.backendId, client?.code]
      .filter(value => value !== null && value !== undefined && value !== '')
      .map(value => String(value));
    return keys.includes(String(record.clientId)) || keys.includes(String(record.clientBackendId));
  }
  function orderById(id)   {
    const key = String(id);
    return D.value.orders.find(o => String(o.id) === key || String(o.backendId) === key || String(o.code) === key) ||
      D.value.purchaseOrders.find(o => String(o.id) === key || String(o.backendId) === key || String(o.code) === key);
  }
  function purchaseRequestById(id) {
    return D.value.purchaseRequests.find(r =>
      r.id === id ||
      r.code === id ||
      String(r.backendId) === String(id)
    );
  }
  function purchaseOrderById(id) {
    const key = String(id);
    return D.value.purchaseOrders.find(o => String(o.id) === key || String(o.backendId) === key || String(o.code) === key);
  }
  function dispatchOrderById(id) {
    const key = String(id);
    return D.value.dispatchOrders.find(d => String(d.id) === key || String(d.backendId) === key || String(d.code) === key);
  }
  function deliveryAddressById(id) { return D.value.deliveryAddresses.find(a => a.id === id); }
  function contactByClientId(clientId) { return D.value.clientContacts.find(c => c.clientId === clientId && c.isPrimary) || D.value.clientContacts.find(c => c.clientId === clientId); }
  function requestItemsFor(requestId) { return D.value.requestItems.filter(item => item.purchaseRequestId === requestId); }
  function orderItemsFor(orderId) { return D.value.orderItems.filter(item => item.orderId === orderId); }
  function documentsForOrder(orderId) { return D.value.businessDocuments.filter(doc => doc.orderId === orderId); }
  function dispatchForOrder(orderId) {
    const order = orderById(orderId) || purchaseOrderById(orderId);
    const keys = [orderId, order?.id, order?.backendId, order?.code]
      .filter(value => value !== null && value !== undefined && value !== '')
      .map(value => String(value));
    return D.value.dispatchOrders.find(dispatch =>
      keys.includes(String(dispatch.orderId)) || keys.includes(String(dispatch.orderBackendId))
    );
  }
  function timelineForOrder(orderId) {
    const order = orderById(orderId) || purchaseOrderById(orderId);
    const keys = [orderId, order?.id, order?.backendId, order?.code]
      .filter(value => value !== null && value !== undefined && value !== '')
      .map(value => String(value));
    const dispatchKeys = D.value.dispatchOrders
      .filter(dispatch => keys.includes(String(dispatch.orderId)) || keys.includes(String(dispatch.orderBackendId)))
      .flatMap(dispatch => [dispatch.id, dispatch.backendId, dispatch.code])
      .filter(value => value !== null && value !== undefined && value !== '')
      .map(value => String(value));
    return D.value.orderTimelineEvents.filter(event =>
      keys.includes(String(event.orderId)) ||
      keys.includes(String(event.orderBackendId)) ||
      dispatchKeys.includes(String(event.dispatchOrderId)) ||
      dispatchKeys.includes(String(event.dispatchBackendId))
    );
  }
  function lifecycleEventsForOrder(orderId) {
    const order = orderById(orderId) || purchaseOrderById(orderId);
    if (!order) return [];
    const code = String(order.code || order.id || '');
    const request = D.value.purchaseRequests.find(row =>
      (order.purchaseRequestId && (row.id === order.purchaseRequestId || row.code === order.purchaseRequestId || String(row.backendId) === String(order.purchaseRequestId))) ||
      (row.convertedOrderId && (row.convertedOrderId === order.id || row.convertedOrderId === order.backendId))
    ) || (code.startsWith('BUY-ORD-')
      ? D.value.purchaseRequests.find(row => row.code === code.replace(/^BUY-ORD-/, 'REQ-') || row.id === code.replace(/^BUY-ORD-/, 'REQ-'))
      : null) || (code.startsWith('SAL-ORD-')
      ? D.value.purchaseRequests.find(row => row.code === code.replace(/^SAL-ORD-/, 'REQ-') || row.id === code.replace(/^SAL-ORD-/, 'REQ-'))
      : null);
    const milestones = [];
    if (request?.createdAt) {
      milestones.push({
        id: `request-${request.id}`,
        orderId: order.id,
        status: 'submitted',
        label: `Request ${request.code} received.`,
        timestamp: request.createdAt,
        visibleToBuyer: true,
      });
    }
    if (request && ['accepted', 'approved', 'converted_to_order'].includes(request.status)) {
      milestones.push({
        id: `validation-${request.id}`,
        orderId: order.id,
        status: 'validating',
        label: `Request ${request.code} accepted by Sales.`,
        timestamp: order.createdAt || request.updatedAt,
        visibleToBuyer: true,
      });
    }
    if (order.createdAt) {
      milestones.push({
        id: `order-${order.id}`,
        orderId: order.id,
        status: 'confirmed',
        label: `Purchase order ${code} created.`,
        timestamp: order.createdAt,
        visibleToBuyer: true,
      });
    }
    const firstDocument = [...documentsForOrder(order.id)]
      .sort((a, b) => new Date(a.createdAt || a.updatedAt) - new Date(b.createdAt || b.updatedAt))[0];
    if (firstDocument) {
      milestones.push({
        id: `documents-${order.id}`,
        orderId: order.id,
        status: 'document_pending',
        label: `Business documents provisioned for ${code}.`,
        timestamp: firstDocument.createdAt || firstDocument.updatedAt,
        visibleToBuyer: true,
      });
    }
    return [...milestones, ...timelineForOrder(order.id).filter(event => event.visibleToBuyer !== false)]
      .sort((a, b) => new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt));
  }
  function messagesForRequest(requestId) {
    return D.value.messages.filter(message =>
      message.requestId === requestId || message.purchaseRequestId === requestId
    );
  }
  function messagesForOrder(orderId) { return D.value.messages.filter(message => message.orderId === orderId); }
  function paymentMethodsForClient(clientId) { return D.value.paymentMethods.filter(method => clientRecordMatches(method, clientId)); }
  function creditRequestsForClient(clientId) { return D.value.creditRequests.filter(request => clientRecordMatches(request, clientId)); }
  function creditPaymentsForClient(clientId) { return D.value.creditPayments.filter(payment => clientRecordMatches(payment, clientId)); }
  function temperatureForOrder(orderId) { return D.value.temperatureLogs.filter(log => log.orderId === orderId); }
  function promotionsForProduct(productId) {
    return D.value.promotions.filter(promo =>
      promo.status === 'active' && (promo.productIds || []).includes(productId)
    );
  }

  function nextOrderId(prefix = `SAL-ORD-${new Date().getFullYear()}`) {
    const nums = [...D.value.orders, ...D.value.purchaseOrders]
      .map(o => parseInt((o.id || o.code || '').split('-').pop(), 10))
      .filter(n => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    
    let startVal = 201;
    if (prefix.startsWith('BUY-ORD-') || prefix.includes('BUY-ORD')) {
      startVal = 301;
    }
    
    const next = Math.max(startVal, max + 1);
    return `${prefix}-${String(next).padStart(4, '0')}`;
  }

  function nextCode(prefix, collection, width = 4) {
    const nums = collection
      .map(item => parseInt(String(item.id || item.code || '').split('-').pop(), 10))
      .filter(n => !Number.isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    
    let startVal = 1;
    if (prefix.startsWith('REQ-')) {
      startVal = 301;
    } else if (prefix.startsWith('SAL-ORD-')) {
      startVal = 201;
    } else if (prefix.startsWith('BUY-ORD-')) {
      startVal = 301;
    }
    
    const nextVal = Math.max(startVal, max + 1);
    return `${prefix}-${String(nextVal).padStart(width, '0')}`;
  }

  const backendIdOf = (item) => {
    const value = item?.backendId ?? item?.id;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };

  function clientBackendId(clientId) {
    return backendIdOf(clientById(clientId)) || Number(clientId) || null;
  }

  function productBackendId(productId) {
    if (Number.isFinite(Number(productId))) return Number(productId);
    const direct = productById(productId);
    if (direct) return Number(direct.catalogItemBackendId) || Number(direct.backendId) || null;
    const productCode = String(productId || '').trim().toUpperCase();
    const byCode = D.value.products.find(product =>
      String(product.id || '').toUpperCase() === productCode ||
      String(product.productId || '').toUpperCase() === productCode ||
      String(product.sku || '').toUpperCase() === productCode ||
      String(product.catalogItemId || '').toUpperCase() === productCode
    );
    return Number(byCode?.catalogItemBackendId) || Number(byCode?.backendId) || null;
  }

  function requestBackendId(requestId) {
    return backendIdOf(purchaseRequestById(requestId)) || Number(requestId) || null;
  }

  function orderBackendId(orderId) {
    return backendIdOf(purchaseOrderById(orderId) || orderById(orderId)) || Number(orderId) || null;
  }

  function dispatchBackendId(dispatchId) {
    return backendIdOf(dispatchOrderById(dispatchId)) || Number(dispatchId) || null;
  }

  function decrementStockForItems(items) {
    for (const item of items) {
      const pId = item.productId || item.catalogItemId;
      const product = D.value.products.find(p => p.id === pId || p.sku === pId);
      const qty = Number(item.qty ?? item.quantity ?? 0);
      if (product) {
        product.stock = Math.max(0, Number(product.stock || 0) - qty);
        product.status = product.stock <= 0 ? 'out' : (product.stock <= product.minStock ? 'low' : 'ok');
      }
      const snapshot = D.value.availabilitySnapshots.find(s => s.productId === pId);
      if (snapshot) {
        snapshot.stock = Math.max(0, Number(snapshot.stock || 0) - qty);
        snapshot.available = Math.max(0, Number(snapshot.stock || 0) - Number(snapshot.reserved || 0));
      }
      const movementId = nextCode('STM', D.value.stockMovements, 3);
      D.value.stockMovements.push({
        id: movementId,
        productId: pId,
        type: 'dispatch',
        qty: qty,
        date: new Date().toISOString(),
        reference: 'Live Buyer Sale',
      });
    }
  }

  async function addOrder(order) {
    const payload = {
      ...order,
      clientAccountId: clientBackendId(order.clientAccountId || order.clientId || order.customerId),
    };
    let created;
    try {
      created = await purchaseOrdersApplication.createOrder(payload);
    } catch (error) {
      // The API provisions downstream records after persisting the order. If that
      // response is interrupted, reconcile before reporting a false creation failure.
      const orders = await readCoreCollection(() => purchaseOrdersApplication.getOrders());
      created = orders.find(candidate =>
        String(candidate.id) === String(order.id) ||
        String(candidate.code) === String(order.code || order.id)
      );
      if (!created) throw error;
    }
    decrementStockForItems(order.items);
    try {
      await loadCoreCollections();
    } catch (error) {
      console.error('[Nexa API] Order created but post-create refresh failed', error);
      loadError.value = 'common.dataLoadError';
    }
    return purchaseOrderById(created.id) || purchaseOrderById(created.backendId) || created;
  }

  function addActivity(text, type = 'info') {
    const entry = {
      id: nextCode('ACT', D.value.activityLog, 3),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      text,
      type,
    };
    D.value.activityLog.unshift(entry);
    D.value.activity = D.value.activityLog;
  }

  async function addPurchaseRequest({
    clientId,
    buyerUserId,
    deliveryAddressId,
    requestedDeliveryDate,
    deliveryDetails = {},
    paymentOption = '',
    shippingEstimate = null,
    comments,
    priority = 'normal',
    documentProfile = null,
    commercialOwner = '',
    status = 'submitted',
    items = [],
  }) {
    const id = nextCode(`REQ-${new Date().getFullYear()}`, D.value.purchaseRequests, 4);
    const backendClientId = clientBackendId(clientId);
    if (!backendClientId) throw new Error(`Client ${clientId} is not linked to a platform account.`);

    const createdRequest = await api.purchaseRequests.create({
      clientAccountId: backendClientId,
      code: id,
      origin: buyerUserId ? 'buyer_portal' : 'commercial',
      status,
      priority,
      requestedDeliveryDate: requestedDeliveryDate || null,
      deliveryAddress: deliveryDetails.address || '',
      deliveryDistrict: deliveryDetails.district || '',
      deliveryCity: deliveryDetails.city || '',
      deliveryProvince: deliveryDetails.province || '',
      deliveryReference: deliveryDetails.reference || '',
      paymentOption,
      shippingEstimate,
      comments: comments || '',
      commercialOwner,
    });

    const request = normalizePurchaseRequests([createdRequest], D.value.clients)[0];
    request.buyerUserId = buyerUserId;
    request.deliveryAddressId = deliveryAddressId;
    request.createdByRole = buyerUserId ? 'buyer' : 'commercial';
    request.documentProfile = documentProfile || clientById(clientId)?.documentProfile || 'standard_docs';

    const linePayloads = items.map(item => {
      const productId = item.productId || item.id || item.sku;
      const catalogItemId = Number(item.catalogItemBackendId || item.backendId) || productBackendId(productId);
      if (!catalogItemId) throw new Error(`Product ${productId} is not linked to a platform catalog item.`);
      const product = productById(productId) || {};
      const quantity = Number(item.qty || item.quantity || 1);
      return {
        purchaseRequestId: createdRequest.id,
        catalogItemId,
        quantity,
        unit: item.unit || product.unit || 'UN',
        estimatedWeightKg: Number(item.estimatedWeightKg || product.weightKg || 1) * quantity,
        notes: item.notes || '',
      };
    });

    const createdLines = await Promise.all(linePayloads.map(line => api.requestItems.create(line)));
    const requestItems = normalizePurchaseRequestLines(createdLines, [request], D.value.products);
    D.value.purchaseRequests.unshift(request);
    D.value.requestItems.unshift(...requestItems);
    addActivity(`${id} submitted from Buyer Portal - ${clientName(clientId)}`, 'info');
    return request;
  }

  async function updateRequestStatus(requestId, status, note = '') {
    const request = purchaseRequestById(requestId);
    if (!request) return null;
    const backendId = requestBackendId(request.id);
    const commandByStatus = {
      approved: {
        action: 'validateCommercially',
        body: { commercialOwner: 'Sales', comments: note || 'Sales approved this buyer request.' },
      },
      needs_adjustment: {
        action: 'requestAdjustment',
        body: note || 'Sales needs adjustments before order confirmation.',
      },
      rejected: {
        action: 'reject',
        body: note || 'Purchase request rejected by Sales.',
      },
      cancelled: {
        action: 'cancel',
        body: note || 'Purchase request cancelled.',
      },
      submitted: {
        action: 'submit',
        body: note || 'Purchase request submitted.',
      },
    };

    if (backendId && commandByStatus[status]) {
      const command = commandByStatus[status];
      await purchaseRequestsApi[command.action](backendId, command.body);
    }

    request.status = status;
    request.updatedAt = new Date().toISOString();
    if (note) request.comments = `${request.comments || ''}\nSales: ${note}`.trim();
    addActivity(`${request.id} updated to ${status}`, status === 'approved' ? 'success' : 'warning');
    return request;
  }

  async function addMessage({
    requestId = null,
    purchaseRequestId = null,
    orderId = null,
    clientId = null,
    title = null,
    senderRole = 'commercial',
    senderName = '',
    body,
    visibleToCommercial = true,
    visibleToBuyer = true,
  }) {
    const normalizedRequestId = requestId || purchaseRequestId;
    const thread = D.value.chatThreads.find(item =>
      (normalizedRequestId && (item.requestId === normalizedRequestId || item.purchaseRequestId === normalizedRequestId)) || (orderId && item.orderId === orderId)
    );
    const message = {
      id: nextCode('MSG', D.value.messages, 3),
      threadId: thread?.id || nextCode('TH', D.value.chatThreads, 3),
      requestId: normalizedRequestId,
      purchaseRequestId: normalizedRequestId,
      orderId,
      clientId,
      senderRole,
      senderName,
      body,
      createdAt: new Date().toISOString(),
      visibleToCommercial,
      visibleToBuyer,
    };
    if (!thread) {
      const newThread = {
        id: message.threadId,
        requestId: normalizedRequestId,
        purchaseRequestId: normalizedRequestId,
        orderId,
        clientId: clientId || (normalizedRequestId ? purchaseRequestById(normalizedRequestId)?.clientId : purchaseOrderById(orderId)?.clientId),
        title: title || normalizedRequestId || orderId || 'Client message',
        status: 'open',
      };
      D.value.chatThreads.push(newThread);
    }
    const request = normalizedRequestId ? purchaseRequestById(normalizedRequestId) : null;
    const order = orderId ? purchaseOrderById(orderId) : null;
    const resolvedClientId = clientId || request?.clientId || order?.clientId;
    const created = await api.messages.create({
      clientAccountId: resolvedClientId ? clientBackendId(resolvedClientId) : null,
      purchaseRequestId: normalizedRequestId ? requestBackendId(normalizedRequestId) : null,
      orderId: orderId ? orderBackendId(orderId) : null,
      senderRole,
      senderName,
      body,
      visibleToBuyer,
    });
    const normalized = normalizeMessages([created], D.value.purchaseRequests, D.value.purchaseOrders, D.value.clients)[0];
    D.value.messages.push(normalized);
    return normalized;
  }

  async function setDefaultPaymentMethod(methodId) {
    const method = D.value.paymentMethods.find(item => item.id === methodId);
    if (!method) return null;
    const backendId = backendIdOf(method);
    if (!backendId) throw new Error('Payment method is not available for this workspace.');
    await api.paymentMethods.request((client, endpointPath) =>
      client.post(api.paymentMethods.pathFor(client, `/${backendId}/status-changes`, endpointPath), {
        status: 'active',
        isDefault: true,
      }).then(response => response.data)
    );
    D.value.paymentMethods = D.value.paymentMethods.map(item =>
      item.clientId === method.clientId ? { ...item, isDefault: item.id === methodId } : item
    );
    return D.value.paymentMethods.find(item => item.id === methodId);
  }

  async function addPaymentMethod({ clientId, type, label, isDefault = false }) {
    const backendClientId = clientBackendId(clientId);
    if (!backendClientId) throw new Error('A valid buyer client account is required.');
    const created = await api.paymentMethods.create({
      clientAccountId: backendClientId,
      type,
      label,
      isDefault,
    });
    const method = normalizePaymentMethods([created], D.value.clients)[0];
    if (isDefault) {
      D.value.paymentMethods = D.value.paymentMethods.map(item => ({ ...item, isDefault: false }));
    }
    D.value.paymentMethods.unshift(method);
    return method;
  }

  async function addCreditRequest({ clientId, requestedAmount, reason, createdByUserId }) {
    const client = clientById(clientId);
    const created = await api.creditRequests.create({
      clientAccountId: clientBackendId(clientId),
      code: nextCode('CRQ', D.value.creditRequests, 3),
      requestedAmount: Number(requestedAmount || 0),
      reason: reason || 'Monthly credit limit increase requested from buyer portal.',
      createdByUserId: createdByUserId || null,
    });
    const request = { ...created, clientId, backendId: created.id };
    D.value.creditRequests.unshift(request);
    await addMessage({
      clientId,
      title: request.id,
      senderRole: 'buyer',
      senderName: contactByClientId(clientId)?.name || client?.contact || 'B2B Buyer',
      body: `Credit increase requested for ${clientName(clientId)}. Requested amount: S/ ${request.requestedAmount.toLocaleString()}. Reason: ${request.reason}`,
      visibleToCommercial: true,
      visibleToBuyer: true,
    });
    addActivity(`${request.code} credit increase requested - ${clientName(clientId)}`, 'warning');
    return request;
  }

  async function acceptRequestAsOrder(requestId) {
    const request = purchaseRequestById(requestId);
    if (!request) return null;
    if (request.convertedOrderId) return purchaseOrderById(request.convertedOrderId);
    const backendId = requestBackendId(request.id);
    if (!backendId) throw new Error(`Purchase request ${request.id} is not linked to a platform record.`);

    const endpoint = api.purchaseRequests;
    const result = await endpoint.request((client, endpointPath) =>
      client.post(endpoint.pathFor(client, `/${backendId}/acceptances`, endpointPath), {
        note: `Sales accepted ${request.id} into an operational order.`,
      }).then(response => response.data)
    );

    const requestItems = D.value.requestItems.filter(item => item.purchaseRequestId === requestId);
    decrementStockForItems(requestItems);
    await loadCoreCollections();
    const order = purchaseOrderById(result.orderId) ||
      D.value.purchaseOrders.find(item => Number(item.backendId) === Number(result.orderId));
    if (order) {
      request.status = 'converted_to_order';
      request.convertedOrderId = order.id;
      addActivity(`${request.id} accepted as ${order.id}`, 'success');
    }
    return order || result;
  }

  async function updateDispatchStatus(dispatchId, status) {
    const dispatch = dispatchOrderById(dispatchId);
    if (!dispatch) return null;
    const backendId = dispatchBackendId(dispatch.id);
    const commandByStatus = {
      assigned: { suffix: 'assignees', body: { responsible: dispatch.responsible }, method: 'post' },
      scheduled: {
        suffix: 'schedules',
        body: {
          eta: dispatch.eta || new Date().toISOString(),
          deliveryWindow: dispatch.deliveryWindow || dispatch.eta || new Date().toISOString().slice(0, 10),
          note: 'Dispatch scheduled from operations board.',
        },
        method: 'post',
      },
      preparing: {
        suffix: 'status-changes',
        body: {
          status: 'preparing',
          note: 'Dispatch preparation started.',
          visibleToBuyer: true,
        },
        method: 'post',
      },
      ready_for_route: {
        suffix: 'status-changes',
        body: {
          status: 'ready_for_route',
          note: 'Dispatch ready for route.',
          visibleToBuyer: true,
        },
        method: 'post',
      },
      in_route: { suffix: 'route-starts', body: null, method: 'post' },
      delivered: { suffix: 'deliveries', body: null, method: 'post' },
      incident: { suffix: 'incidents', body: { note: 'Incident reported from dispatch board.' }, method: 'post' },
      reprogrammed: {
        suffix: 'reschedules',
        body: {
          eta: dispatch.eta || new Date().toISOString(),
          deliveryWindow: dispatch.deliveryWindow || dispatch.eta || new Date().toISOString().slice(0, 10),
          note: 'Dispatch reprogrammed from operations board.',
        },
        method: 'post',
      },
    };

    if (backendId && commandByStatus[status]) {
      const endpoint = api.dispatchOrders;
      const command = commandByStatus[status];
      await endpoint.request((client, endpointPath) =>
        client[command.method || 'put'](endpoint.pathFor(client, `/${backendId}/${command.suffix}`, endpointPath), command.body)
          .then(response => response.data)
      );
    }

    dispatch.status = status;
    dispatch.column = status;
    await loadCoreCollections();
    addActivity(`${dispatch.id} updated to ${status}`, status === 'delivered' ? 'success' : 'info');
    return dispatchOrderById(dispatch.id) || dispatch;
  }

  async function completePod(dispatchId) {
    const dispatch = dispatchOrderById(dispatchId);
    if (!dispatch) return null;
    const existing = D.value.proofOfDelivery.find(pod => pod.dispatchOrderId === dispatch.id);
    const payload = {
      status: dispatch.status === 'delayed' ? 'observed' : 'complete',
      photoReference: true,
      signatureReference: true,
      receivedBy: contactByClientId(dispatch.clientId)?.name || 'Client',
      completedAt: new Date().toISOString(),
      notes: dispatch.status === 'delayed' ? 'POD observed due to delayed delivery state.' : 'POD completed with delivery references.',
    };
    if (existing) {
      Object.assign(existing, payload);
      const backendId = backendIdOf(existing);
      if (backendId) {
        const endpoint = api.proofOfDelivery;
        await endpoint.request((client, endpointPath) =>
          client.put(endpoint.pathFor(client, `/${backendId}/complete`, endpointPath), {
            receivedBy: payload.receivedBy,
            completedAt: payload.completedAt,
            photoReference: payload.photoReference,
            signatureReference: payload.signatureReference,
            notes: payload.notes,
          }).then(response => response.data)
        );
      }
      return existing;
    }
    const backendDispatchId = dispatchBackendId(dispatch.id);
    if (!backendDispatchId) throw new Error(`Dispatch ${dispatch.id} is not linked to a platform record.`);
    const created = await api.proofOfDelivery.request((client) =>
      client.post(api.proofOfDelivery.pathFor(client, `/dispatch-orders/${backendDispatchId}/proofs-of-delivery`, '/api/v1'), {
        receivedBy: payload.receivedBy,
        completedAt: payload.completedAt,
        photoReference: payload.photoReference,
        signatureReference: payload.signatureReference,
        notes: payload.notes,
      }).then(response => response.data)
    );
    const pod = normalizeProofOfDelivery([created], D.value.dispatchOrders)[0];
    D.value.proofOfDelivery.unshift(pod);
    return pod;
  }

  async function updateDocumentStatus(documentId, status) {
    const document = D.value.businessDocuments.find(doc => doc.id === documentId);
    if (!document) return null;
    const backendId = backendIdOf(document);
    if (!backendId) throw new Error(`Business document ${document.id} is not linked to a platform record.`);
    const visibleToBuyer = ['ready', 'uploaded', 'accepted'].includes(status);
    const updated = await api.businessDocuments.request((client, endpointPath) =>
      client.post(api.businessDocuments.pathFor(client, `/${backendId}/status-changes`, endpointPath), {
        status,
        visibleToBuyer,
      }).then(response => response.data)
    );
    const normalized = normalizeBusinessDocuments([updated], D.value.purchaseOrders, D.value.clients)[0];
    Object.assign(document, normalized);
    addActivity(`${document.label} for ${document.orderId} marked as ${status}`, 'info');
    return document;
  }

  async function downloadBusinessDocument(documentId) {
    const document = D.value.businessDocuments.find(row => row.id === documentId);
    if (!document?.backendId || !document.fileName) throw new Error('Document content is not available.');
    return businessDocumentsApi.downloadContent(document.backendId);
  }

  async function generateBusinessDocument({ orderId, type }) {
    const backendOrderId = orderBackendId(orderId);
    if (!backendOrderId) throw new Error('A confirmed purchase order is required before generating a business document.');
    const created = await businessDocumentsApi.generate({ orderId: backendOrderId, type });
    const normalized = normalizeBusinessDocuments([created], D.value.purchaseOrders, D.value.clients)[0];
    const existingIndex = D.value.businessDocuments.findIndex(document =>
      document.orderId === normalized.orderId && document.type === normalized.type);
    if (existingIndex >= 0) D.value.businessDocuments.splice(existingIndex, 1, normalized);
    else D.value.businessDocuments.unshift(normalized);
    addActivity(`${normalized.label} generated for ${normalized.orderId}`, 'success');
    return normalized;
  }

  async function addBusinessDocument(payload) {
    const typeLabels = {
      factura_xml: 'Factura XML',
      factura_pdf: 'Factura PDF',
      guia_pdf: 'Guia de remision PDF',
    };
    const type = payload.type || 'factura_pdf';
    const orderId = payload.orderId || payload.relatedOrder;
    const clientId = payload.clientId || purchaseOrderById(orderId)?.clientId;
    const backendOrderId = orderBackendId(orderId);
    const backendClientId = clientBackendId(clientId);
    if (!backendOrderId) throw new Error('A confirmed purchase order is required before adding a business document.');
    if (!backendClientId) throw new Error('A valid B2B client account is required before adding a business document.');

    const created = await api.businessDocuments.create({
      orderId: backendOrderId,
      clientAccountId: backendClientId,
      type,
      fileName: payload.fileName || '',
      label: payload.label || typeLabels[type] || 'Business document',
      required: payload.required !== false,
      visibleToBuyer: ['ready', 'uploaded', 'accepted'].includes(payload.status),
    });
    const document = normalizeBusinessDocuments([created], D.value.purchaseOrders, D.value.clients)[0];
    D.value.businessDocuments.unshift(document);
    addActivity(`Business document added: ${document.label} - ${clientName(document.clientId)}`, 'info');
    return document;
  }

  async function addPromotion(payload) {
    const name = payload.name || payload.title;
    const discountLabel = payload.discountLabel || payload.commercialRule;
    if (!name) throw new Error('Promotion name is required.');
    if (!discountLabel) throw new Error('Promotion commercial rule is required.');

    const created = await api.promotions.create({
      code: nextCode('PROM', D.value.promotions, 3),
      status: payload.status || 'draft',
      name,
      discountLabel,
      visibility: payload.visibility || 'buyer_portal',
      productIds: payload.productIds || [],
      ...payload,
    });
    const promotion = normalizePromotions([created])[0];
    D.value.promotions.unshift(promotion);
    addActivity(`Promotion created: ${promotion.name}`, 'success');
    return promotion;
  }

  async function updatePromotion(promotionId, payload) {
    const promotion = D.value.promotions.find(item => item.id === promotionId);
    if (!promotion) return null;
    const updated = await api.promotions.patch(promotion.backendId || promotion.id, payload);
    Object.assign(promotion, normalizePromotions([updated])[0]);
    addActivity(`Promotion updated: ${promotion.name}`, 'info');
    return promotion;
  }

  async function updatePromotionStatus(promotionId, status) {
    const promotion = D.value.promotions.find(item => item.id === promotionId);
    if (!promotion) return null;
    const updated = await api.promotions.patch(promotion.backendId || promotion.id, { status });
    Object.assign(promotion, normalizePromotions([updated])[0]);
    addActivity(`Promotion ${promotion.name} set to ${status}`, status === 'active' ? 'success' : 'info');
    return promotion;
  }

  async function addClient(payload) {
    const client = {
      id: nextCode('CLI', D.value.clients, 3),
      businessName: payload.businessName || payload.commercialName || 'New B2B client',
      commercialName: payload.commercialName || payload.businessName || 'New B2B client',
      ruc: payload.ruc || payload.taxId || '',
      segment: payload.segment || 'Gourmet / refrigerated',
      contact: payload.contact || payload.contactName || '',
      contactEmail: payload.contactEmail || '',
      phone: payload.phone || '',
      paymentCondition: payload.paymentCondition || payload.creditCondition || 'credit_15',
      monthlyCreditLimit: Number(payload.monthlyCreditLimit || payload.creditLimit || 0),
      monthlyCreditUsed: Number(payload.monthlyCreditUsed || 0),
      monthlyCreditAvailable: Number(payload.monthlyCreditLimit || payload.creditLimit || 0),
      monthlyCreditStatus: payload.monthlyCreditStatus || payload.status || 'ok',
      deliveryPreference: payload.deliveryPreference || 'Cold-chain delivery window',
      portalAccess: payload.portalAccess !== false,
      documentProfile: payload.documentProfile || 'standard_docs',
      status: payload.status || 'active',
      createdAt: new Date().toISOString(),
      ...payload,
    };
    const saved = await clientsApplication.createClient(client);
    D.value.clients.unshift(saved);
    addActivity(`B2B client created: ${saved.commercialName || saved.businessName}`, 'success');
    return saved;
  }

  async function updateClient(clientId, payload) {
    const client = clientById(clientId);
    if (!client) return null;
    const draft = { ...client, ...payload, updatedAt: new Date().toISOString() };
    const limit = Number(draft.monthlyCreditLimit ?? draft.creditLimit ?? 0);
    const used = Number(draft.monthlyCreditUsed ?? draft.creditUsed ?? 0);
    draft.monthlyCreditAvailable = Math.max(0, limit - used);
    const backendId = client.backendId || client.id;
    const saved = await clientsApplication.updateClient(backendId, draft);
    Object.assign(client, saved);
    addActivity(`B2B client updated: ${client.commercialName || client.businessName}`, 'info');
    return client;
  }

  async function addStockMovement(payload) {
    const product = productById(payload.productId);
    const quantity = Number(payload.quantity ?? payload.qty ?? 0);
    const absQty = Math.abs(quantity);
    const type = payload.type || 'entry';
    const signedQty = type === 'exit'
      ? -absQty
      : type === 'adjustment'
        ? quantity
        : absQty;
    const draft = {
      id: nextCode('STM', D.value.stockMovements, 3),
      productId: payload.productId,
      warehouse: payload.warehouse || product?.warehouse || D.value.warehouses[0]?.name || null,
      type,
      qty: signedQty,
      lotId: payload.lotId || payload.lotNumber || null,
      orderId: payload.orderId || payload.reference || null,
      reference: payload.orderId || payload.reference || null,
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      expirationDate: payload.expirationDate || null,
      temperatureReading: payload.temperatureReading ?? null,
      note: payload.note || payload.notes || '',
      user: payload.user || D.value.user.name || '',
    };
    const movement = await api.stockMovements.create(draft);
    D.value.stockMovements.unshift(movement);
    D.value.movements = D.value.stockMovements;
    if (product) {
      if (type === 'entry') product.stock = Number(product.stock || 0) + absQty;
      if (type === 'exit') product.stock = Math.max(0, Number(product.stock || 0) - absQty);
      if (type === 'adjustment') product.stock = Math.max(0, Number(product.stock || 0) + quantity);
      if (type === 'reservation_release') product.reserved = Math.max(0, Number(product.reserved || 0) - absQty);
      const available = Number(product.stock || 0) - Number(product.reserved || 0);
      const availablePercent = product.stock ? (available / Number(product.stock || 1)) * 100 : 0;
      product.status = available <= 0 ? 'out' : (availablePercent <= 20 || available <= Number(product.minStock || 0) ? 'low' : 'ok');
      const snapshot = D.value.availabilitySnapshots.find(row => row.productId === product.id);
      if (snapshot) {
        snapshot.stock = product.stock;
        snapshot.reserved = product.reserved;
        snapshot.available = Math.max(0, available);
      }
    }
    addActivity(`Stock movement ${movement.id} registered for ${productName(movement.productId)}`, 'success');
    return movement;
  }

  async function readCoreCollection(loader, collectionKey = 'collection') {
    try {
      const rows = await loader();
      delete collectionErrors.value[collectionKey];
      return Array.isArray(rows) ? rows : [];
    } catch (error) {
      console.error('[Nexa API] Failed to load collection', error);
      loadError.value = 'common.dataLoadError';
      collectionErrors.value[collectionKey] = {
        message: error?.response?.data?.detail || error?.message || 'common.dataLoadError',
        status: error?.response?.status || null,
        failedAt: new Date().toISOString(),
      };
      return [];
    }
  }

  // Runtime resources are loaded from configured Nexa platform services.

  const businessDocumentsApi = new BusinessDocumentsApi();
  const purchaseRequestsApi = new PurchaseRequestsApi();

  function orderItemsFromCoreOrders(orders = [], products = D.value.products) {
    return orders.flatMap(order => (order.items || []).map((item, index) => {
      const product = products.find(row => row.id === item.productId) || productById(item.productId) || {};
      const quantity = Number(item.quantity ?? item.qty ?? 0);
      const price = Number(item.price ?? item.unitPriceAmount ?? 0);

      return {
        id: item.id || `${order.id}-ITEM-${String(index + 1).padStart(2, '0')}`,
        orderId: order.id,
        productId: item.productId,
        catalogItemId: item.catalogItemId,
        itemName: item.itemName || product.name,
        quantity,
        unit: product.unit || 'UN',
        price,
        estimatedWeightKg: Number(product.weightKg || 1) * quantity,
        stockOk: item.stockOk !== false,
      };
    }));
  }

  const codeForBackend = (rows, backendId, fallback = null) =>
    rows.find(row => Number(row.backendId) === Number(backendId) || Number(row.id) === Number(backendId))?.id || fallback;

  const purchaseRequestStatusForUi = (status) => ({
    commercially_validated: 'approved',
    buyer_adjustment_requested: 'needs_adjustment',
  }[status] || status);

  function normalizePurchaseRequests(rows = [], clients = D.value.clients) {
    return rows.map(row => ({
      id: row.code || `REQ-${String(row.id).padStart(4, '0')}`,
      code: row.code || `REQ-${String(row.id).padStart(4, '0')}`,
      backendId: row.id,
      tenantId: row.tenantId,
      clientId: codeForBackend(clients, row.clientAccountId, row.clientAccountId),
      clientBackendId: row.clientAccountId,
      origin: row.origin,
      status: purchaseRequestStatusForUi(row.status),
      priority: row.priority,
      requestedDeliveryDate: row.requestedDeliveryDate,
      deliveryAddress: row.deliveryAddress || '',
      deliveryDistrict: row.deliveryDistrict || '',
      deliveryCity: row.deliveryCity || '',
      deliveryProvince: row.deliveryProvince || '',
      deliveryReference: row.deliveryReference || '',
      paymentOption: row.paymentOption || '',
      shippingEstimate: row.shippingEstimate ?? null,
      comments: row.comments,
      commercialOwner: row.commercialOwner,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      source: 'nexa-platform',
    }));
  }

  function normalizePurchaseRequestLines(rows = [], requests = D.value.purchaseRequests, products = D.value.products) {
    return rows.map(row => {
      const requestId = codeForBackend(requests, row.purchaseRequestId, row.purchaseRequestId);
      const product = products.find(item => Number(item.backendId) === Number(row.catalogItemId) || item.catalogItemId === row.catalogItemId);
      return {
        id: `RI-${String(row.id).padStart(3, '0')}`,
        backendId: row.id,
        tenantId: row.tenantId,
        purchaseRequestId: requestId,
        requestBackendId: row.purchaseRequestId,
        productId: product?.id || row.catalogItemId,
        catalogItemBackendId: row.catalogItemId,
        quantity: Number(row.quantity || 0),
        unit: row.unit,
        estimatedWeightKg: Number(row.estimatedWeightKg || 0),
        notes: row.notes || '',
        source: 'nexa-platform',
      };
    });
  }

  function normalizeBusinessDocuments(rows = [], orders = D.value.purchaseOrders, clients = D.value.clients) {
    return rows.map(row => ({
      id: `DOC-${String(row.id).padStart(3, '0')}`,
      backendId: row.id,
      tenantId: row.tenantId,
      orderId: row.orderId ? codeForBackend(orders, row.orderId, row.orderId) : null,
      orderBackendId: row.orderId,
      clientId: row.clientAccountId ? codeForBackend(clients, row.clientAccountId, row.clientAccountId) : null,
      clientBackendId: row.clientAccountId,
      type: row.type,
      label: row.label,
      status: row.status,
      fileName: row.fileName,
      visibleToBuyer: row.visibleToBuyer,
      required: row.required,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      source: 'nexa-platform',
    }));
  }

  function normalizeDispatchEvents(rows = [], dispatchOrders = D.value.dispatchOrders) {
    return rows.map(row => {
      const dispatch = dispatchOrders.find(item => Number(item.backendId) === Number(row.dispatchOrderId));
      return {
        id: `EV-${String(row.id).padStart(3, '0')}`,
        backendId: row.id,
        tenantId: row.tenantId,
        dispatchOrderId: dispatch?.id || row.dispatchOrderId,
        dispatchBackendId: row.dispatchOrderId,
        orderId: dispatch?.orderId || null,
        orderBackendId: dispatch?.orderBackendId || null,
        status: row.status,
        label: row.description,
        description: row.description,
        timestamp: row.createdAt || row.updatedAt || new Date().toISOString(),
        visibleToBuyer: row.visibleToBuyer,
        source: 'nexa-platform',
      };
    });
  }

  function normalizeProofOfDelivery(rows = [], dispatchOrders = D.value.dispatchOrders) {
    return rows.map(row => {
      const dispatch = dispatchOrders.find(item => Number(item.backendId) === Number(row.dispatchOrderId));
      return {
        id: `POD-${String(row.id).padStart(3, '0')}`,
        backendId: row.id,
        tenantId: row.tenantId,
        dispatchOrderId: dispatch?.id || row.dispatchOrderId,
        dispatchBackendId: row.dispatchOrderId,
        orderId: dispatch?.orderId || null,
        receivedBy: row.receivedBy,
        completedAt: row.completedAt,
        photoReference: row.photoReference,
        signatureReference: row.signatureReference,
        notes: row.notes,
        status: row.status === 'completed' ? 'complete' : row.status,
        source: 'nexa-platform',
      };
    });
  }

  function normalizePaymentMethods(rows = [], clients = D.value.clients) {
    return rows.map(row => ({
      id: `PM-${String(row.id).padStart(3, '0')}`,
      backendId: row.id,
      tenantId: row.tenantId,
      clientId: codeForBackend(clients, row.clientAccountId, row.clientAccountId),
      clientBackendId: row.clientAccountId,
      type: row.type,
      label: row.label,
      status: row.status,
      isDefault: row.isDefault,
      source: 'nexa-platform',
    }));
  }

  function normalizePayments(rows = [], orders = D.value.purchaseOrders, clients = D.value.clients) {
    return rows.map(row => ({
      id: `CPY-${String(row.id).padStart(3, '0')}`,
      backendId: row.id,
      tenantId: row.tenantId,
      orderId: row.orderId ? codeForBackend(orders, row.orderId, row.orderId) : null,
      clientId: row.clientAccountId ? codeForBackend(clients, row.clientAccountId, row.clientAccountId) : null,
      invoiceId: row.invoiceId || null,
      paymentOptionId: row.paymentOptionId || null,
      paymentMethodRecordId: row.paymentMethodRecordId || null,
      referenceCode: row.referenceCode || `PAY-${row.id}`,
      total: Number(row.amount || row.total || 0),
      amount: Number(row.amount || row.total || 0),
      currency: row.currency || 'PEN',
      status: row.status,
      confirmedAt: row.confirmedAt,
      rejectedAt: row.rejectedAt,
      source: 'nexa-platform',
    }));
  }

  function normalizeMessages(rows = [], requests = D.value.purchaseRequests, orders = D.value.purchaseOrders, clients = D.value.clients) {
    return rows.map(row => ({
      id: `MSG-${String(row.id).padStart(3, '0')}`,
      backendId: row.id,
      tenantId: row.tenantId,
      requestId: row.purchaseRequestId ? codeForBackend(requests, row.purchaseRequestId, row.purchaseRequestId) : null,
      purchaseRequestId: row.purchaseRequestId ? codeForBackend(requests, row.purchaseRequestId, row.purchaseRequestId) : null,
      orderId: row.orderId ? codeForBackend(orders, row.orderId, row.orderId) : null,
      clientId: row.clientAccountId ? codeForBackend(clients, row.clientAccountId, row.clientAccountId) : null,
      senderRole: row.senderRole,
      senderName: row.senderName,
      body: row.body,
      visibleToBuyer: row.visibleToBuyer,
      visibleToCommercial: true,
      createdAt: row.createdAt,
      source: 'nexa-platform',
    }));
  }

  function normalizeNotifications(rows = [], clients = D.value.clients) {
    return rows.map(row => ({
      id: `NOT-${String(row.id).padStart(3, '0')}`,
      backendId: row.id,
      tenantId: row.tenantId,
      clientId: row.clientAccountId ? codeForBackend(clients, row.clientAccountId, row.clientAccountId) : null,
      recipientRole: row.recipientRole,
      type: row.type,
      title: row.title,
      body: row.body,
      read: row.read,
      source: 'nexa-platform',
    }));
  }

  function normalizeTemperatureLogs(rows = [], dispatchOrders = D.value.dispatchOrders, orders = D.value.purchaseOrders) {
    return rows.map(row => {
      const dispatch = row.dispatchOrderId ? dispatchOrders.find(item => Number(item.backendId) === Number(row.dispatchOrderId)) : null;
      return {
        id: `TMP-${String(row.id).padStart(3, '0')}`,
        backendId: row.id,
        tenantId: row.tenantId,
        dispatchOrderId: dispatch?.id || row.dispatchOrderId,
        orderId: row.orderId ? codeForBackend(orders, row.orderId, row.orderId) : dispatch?.orderId,
        celsius: Number(row.celsius),
        temp: Number(row.celsius),
        zone: row.zone,
        status: row.status,
        recordedAt: row.recordedAt,
        source: 'nexa-platform',
      };
    });
  }

  function normalizePromotions(rows = []) {
    return rows.map(row => ({
      ...row,
      id: row.id,
      backendId: row.id,
      startDate: row.startsOn || row.startDate || '',
      endDate: row.endsOn || row.endDate || '',
      productIds: row.productIds || [],
      source: 'nexa-platform',
    }));
  }

  async function loadCoreCollections() {
    const [
      tenants,
      clients,
      products,
      categories,
      brands,
      warehouses,
      lots,
      stockMovements,
      orders,
      dispatchOrders,
      purchaseRequests,
      purchaseRequestLines,
      businessDocuments,
      dispatchEvents,
      proofOfDelivery,
      paymentMethods,
      payments,
      messages,
      notifications,
      temperatureLogs,
      promotions,
      auditLogs,
      creditRequests,
    ] = await Promise.all([
      readCoreCollection(() => tenantApi.getTenants(), 'tenants'),
      readCoreCollection(() => clientsApplication.getClients(), 'clients'),
      readCoreCollection(() => catalogApplication.getProducts(), 'products'),
      readCoreCollection(() => catalogApplication.getCategories(), 'categories'),
      readCoreCollection(() => catalogApplication.getBrands(), 'brands'),
      readCoreCollection(() => inventoryApplication.getWarehouses(), 'warehouses'),
      readCoreCollection(() => inventoryApplication.getLots(), 'inventoryLots'),
      readCoreCollection(() => inventoryApplication.getMovements(), 'stockMovements'),
      readCoreCollection(() => purchaseOrdersApplication.getOrders(), 'orders'),
      readCoreCollection(() => dispatchOrdersApplication.getDispatchOrders(), 'dispatchOrders'),
      readCoreCollection(() => api.purchaseRequests.getAll(), 'purchaseRequests'),
      readCoreCollection(() => api.requestItems.getAll(), 'purchaseRequestLines'),
      readCoreCollection(() => api.businessDocuments.getAll(), 'businessDocuments'),
      readCoreCollection(() => api.deliveryEvents.getAll(), 'dispatchEvents'),
      readCoreCollection(() => api.proofOfDelivery.getAll(), 'proofOfDelivery'),
      readCoreCollection(() => api.paymentMethods.getAll(), 'paymentMethods'),
      readCoreCollection(() => paymentsApi.getPayments(), 'payments'),
      readCoreCollection(() => api.messages.getAll(), 'messages'),
      readCoreCollection(() => api.notifications.getAll(), 'notifications'),
      readCoreCollection(() => api.temperatureLogs.getAll(), 'temperatureLogs'),
      readCoreCollection(() => api.promotions.getAll(), 'promotions'),
      readCoreCollection(() => api.auditLogs.getAll(), 'auditLogs'),
      readCoreCollection(() => api.creditRequests.getAll(), 'creditRequests'),
    ]);

    if (tenants.length) {
      D.value.tenants = tenants;
      const tenant = tenants[0];
      D.value.company = {
        ...D.value.company,
        id: tenant.id || tenant.slug || D.value.company.id,
        name: tenant.name || D.value.company.name,
        legalName: tenant.legalName || tenant.name || D.value.company.legalName,
        ruc: tenant.ruc || D.value.company.ruc,
        address: tenant.mainWarehouse?.address || tenant.workspaceUrl || D.value.company.address,
        country: tenant.country || tenant.mainWarehouse?.country || D.value.company.country,
        emailDomain: tenant.emailDomain || D.value.company.emailDomain,
        subscriptionPlan: tenant.plan || D.value.company.subscriptionPlan,
      };
    }
    if (clients.length) D.value.clients = clients;
    if (products.length) D.value.products = products;
    if (categories.length) D.value.categories = categories;
    if (brands.length) D.value.brands = brands;
    if (lots.length) {
      D.value.inventoryLots = lots;
      D.value.lots = lots;
    }
    D.value.stockMovements = stockMovements;
    D.value.movements = stockMovements;
    if (warehouses.length) {
      D.value.warehouses = warehouses.map(warehouse => {
        const warehouseLots = lots.filter(lot => lot.warehouse === warehouse.address || lot.zone === warehouse.address);
        const used = warehouseLots.reduce((sum, lot) => sum + Number(lot.qty || 0), 0);
        const reserved = warehouseLots.reduce((sum, lot) => sum + Number(lot.reserved || 0), 0);
        const capacity = Math.max(100, Math.ceil((used + reserved) * 1.25));
        return {
          ...warehouse,
          zones: (warehouse.zones || []).map(zone => ({
            ...zone,
            used,
            capacity,
          })),
        };
      });
    }
    D.value.orders = orders;
    D.value.purchaseOrders = orders;
    D.value.orderItems = orderItemsFromCoreOrders(orders, products.length ? products : D.value.products);
    D.value.dispatchOrders = dispatchOrders.map(dispatch => {
        const order = orders.find(row => Number(row.backendId) === Number(dispatch.orderId));
        return {
          ...dispatch,
          orderBackendId: dispatch.orderId,
          orderId: order?.id || dispatch.orderId,
          clientId: order?.clientId || dispatch.clientId,
          dest: order?.clientId || dispatch.dest,
          priority: order?.priority || dispatch.priority || 'normal',
        };
      });
    D.value.purchaseRequests = normalizePurchaseRequests(purchaseRequests, D.value.clients);
    D.value.requestItems = normalizePurchaseRequestLines(purchaseRequestLines, D.value.purchaseRequests, D.value.products);
    D.value.businessDocuments = normalizeBusinessDocuments(businessDocuments, D.value.purchaseOrders, D.value.clients);
    D.value.dispatchOrders = D.value.dispatchOrders.map(dispatch => {
      const requiredDocuments = D.value.businessDocuments.filter(document =>
        String(document.orderId) === String(dispatch.orderId) && document.required !== false);
      const readyDocuments = requiredDocuments.filter(document =>
        ['ready', 'uploaded', 'issued', 'approved'].includes(document.status));

      return {
        ...dispatch,
        documentProgress: `${readyDocuments.length}/${requiredDocuments.length}`,
      };
    });
    D.value.deliveryEvents = normalizeDispatchEvents(dispatchEvents, D.value.dispatchOrders);
    D.value.orderTimelineEvents = D.value.deliveryEvents;
    D.value.proofOfDelivery = normalizeProofOfDelivery(proofOfDelivery, D.value.dispatchOrders);
    D.value.paymentMethods = normalizePaymentMethods(paymentMethods, D.value.clients);
    D.value.payments = normalizePayments(payments, D.value.purchaseOrders, D.value.clients);
    D.value.creditPayments = D.value.payments;
    D.value.messages = normalizeMessages(messages, D.value.purchaseRequests, D.value.purchaseOrders, D.value.clients);
    D.value.notifications = normalizeNotifications(notifications, D.value.clients);
    D.value.temperatureLogs = normalizeTemperatureLogs(temperatureLogs, D.value.dispatchOrders, D.value.purchaseOrders);
    D.value.promotions = normalizePromotions(promotions);
    D.value.creditRequests = creditRequests.map(row => {
      const client = D.value.clients.find(item => Number(item.backendId) === Number(row.clientAccountId));
      return { ...row, backendId: row.id, clientId: client?.id || row.clientAccountId };
    });
    D.value.clientContacts = D.value.clients
      .filter(client => client.contact || client.contactEmail || client.phone)
      .map(client => ({
        id: `CONTACT-${client.backendId || client.id}`,
        clientId: client.id,
        name: client.contact || '',
        email: client.contactEmail || '',
        phone: client.phone || '',
        isPrimary: true,
      }));
    D.value.productImages = D.value.products
      .filter(product => product.imageUrl || product.image)
      .map(product => ({
        id: `IMAGE-${product.backendId || product.id}`,
        productId: product.id,
        url: product.imageUrl || product.image,
      }));
    D.value.availabilitySnapshots = D.value.products.map(product => ({
      id: `AVAILABILITY-${product.backendId || product.id}`,
      productId: product.id,
      stock: Number(product.stock || 0),
      reserved: Number(product.reserved || 0),
      available: Math.max(0, Number(product.stock || 0) - Number(product.reserved || 0)),
    }));
    D.value.dispatchItems = D.value.orderItems;
    D.value.alerts = D.value.notifications;
    D.value.activityLog = auditLogs.map(row => ({
      id: row.id,
      time: row.createdAt,
      text: `${row.action}: ${row.resourceType} ${row.resourceId}`,
      type: row.action?.includes('reject') || row.action?.includes('cancel') ? 'warning' : 'info',
      ...row,
    }));
    D.value.activity = D.value.activityLog;
    D.value.supportConversations = D.value.messages;
    D.value.chatThreads = Array.from(new Map(D.value.messages.map(message => {
      const key = message.requestId || message.orderId || message.clientId || message.id;
      return [key, {
        id: `THREAD-${key}`,
        requestId: message.requestId,
        orderId: message.orderId,
        clientId: message.clientId,
        title: message.requestId || message.orderId || message.clientId,
        status: 'open',
      }];
    })).values());
    D.value.proofOfDeliveryUploads = D.value.proofOfDelivery;
    D.value.premiumAccess = D.value.subscriptions;
  }

  async function refreshPurchaseRequests() {
    const [clients, products, purchaseRequests, purchaseRequestLines, messages] = await Promise.all([
      D.value.clients.length ? Promise.resolve([]) : readCoreCollection(() => clientsApplication.getClients(), 'clients'),
      D.value.products.length ? Promise.resolve([]) : readCoreCollection(() => catalogApplication.getProducts(), 'products'),
      readCoreCollection(() => api.purchaseRequests.getAll(), 'purchaseRequests'),
      readCoreCollection(() => api.requestItems.getAll(), 'purchaseRequestLines'),
      readCoreCollection(() => api.messages.getAll(), 'messages'),
    ]);

    if (clients.length) D.value.clients = clients;
    if (products.length) D.value.products = products;
    if (purchaseRequests.length) D.value.purchaseRequests = normalizePurchaseRequests(purchaseRequests, D.value.clients);
    if (purchaseRequestLines.length) D.value.requestItems = normalizePurchaseRequestLines(purchaseRequestLines, D.value.purchaseRequests, D.value.products);
    if (messages.length) D.value.messages = normalizeMessages(messages, D.value.purchaseRequests, D.value.purchaseOrders, D.value.clients);
  }

  async function init() {
    Object.assign(D.value, {
      lots: [],
      movements: [],
      activity: [],
    });
    loading.value = true;
    loadError.value = '';
    try {
      await loadCoreCollections();
    } finally {
      loading.value = false;
    }
  }

  init();

  return {
    D,
    loading,
    loadError,
    collectionErrors,
    clientName,
    productName,
    productById,
    clientById,
    clientRecordMatches,
    orderById,
    purchaseRequestById,
    purchaseOrderById,
    dispatchOrderById,
    deliveryAddressById,
    contactByClientId,
    requestItemsFor,
    orderItemsFor,
    documentsForOrder,
    dispatchForOrder,
    timelineForOrder,
    lifecycleEventsForOrder,
    messagesForRequest,
    messagesForOrder,
    paymentMethodsForClient,
    creditRequestsForClient,
    creditPaymentsForClient,
    temperatureForOrder,
    promotionsForProduct,
    nextOrderId,
    addOrder,
    addPurchaseRequest,
    refreshCoreCollections: loadCoreCollections,
    refreshPurchaseRequests,
    updateRequestStatus,
    addMessage,
    addPaymentMethod,
    setDefaultPaymentMethod,
    addCreditRequest,
    acceptRequestAsOrder,
    updateDispatchStatus,
    completePod,
    addBusinessDocument,
    updateDocumentStatus,
    downloadBusinessDocument,
    generateBusinessDocument,
    addPromotion,
    updatePromotion,
    updatePromotionStatus,
    addClient,
    updateClient,
    addStockMovement,
  };
});
