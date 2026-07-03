<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDataStore } from '@/app/application/stores/data.store';
import { useAuthStore } from '@/iam/application/iam.store';
import { requestStatusLabel, requestStatusBadge, displayCode } from '@/shared/status';
import { creditSummary } from '@/shared/credit';

const route = useRoute();
const router = useRouter();
const ds = useDataStore();
const auth = useAuthStore();

const actionNote = ref('');
const actionError = ref('');
const actionSuccess = ref('');
const loadingRequest = ref(false);
const saving = ref(false);

const request = computed(() => ds.purchaseRequestById(route.params.id));
const client = computed(() => request.value ? ds.clientById(request.value.clientId) : null);
const items = computed(() => request.value ? ds.requestItemsFor(request.value.id).map(item => {
  const product = ds.productById(item.productId) || {};
  return {
    ...item,
    product,
    name: product.name || item.itemName || item.productId,
    imageUrl: product.imageUrl || '',
    sku: product.sku || item.productId,
    price: Number(product.price || item.price || 0),
    unit: product.unit || item.unit || 'UN',
  };
}) : []);
const messages = computed(() => request.value ? ds.messagesForRequest(request.value.id) : []);
const credit = computed(() => creditSummary(client.value || {}));
const requiredDocs = ['Factura XML', 'Factura PDF', 'Guia de remision PDF'];
const canRespond = computed(() => request.value && !['approved', 'rejected', 'converted_to_order'].includes(request.value.status));

onMounted(async () => {
  if (request.value) return;
  loadingRequest.value = true;
  try {
    await ds.refreshPurchaseRequests();
  } finally {
    loadingRequest.value = false;
  }
});

function requireNote(action) {
  if (action === 'approved') return false;
  if (actionNote.value.trim()) return false;
  actionError.value = 'Add an observation before requesting adjustments or rejecting.';
  return true;
}

async function runAction(status) {
  if (!request.value || !canRespond.value || requireNote(status)) return;
  saving.value = true;
  actionError.value = '';
  actionSuccess.value = '';
  try {
    const note = actionNote.value.trim();
    if (note) {
      await ds.addMessage({
        requestId: request.value.id,
        clientId: request.value.clientId,
        senderRole: 'sales',
        senderName: auth.user?.displayName || auth.user?.name || '',
        body: note,
        visibleToBuyer: true,
      });
    }

    if (status === 'approved') {
      await ds.updateRequestStatus(request.value.id, 'approved', note || 'Sales approved the request and created a traceable purchase order.');
      const order = await ds.acceptRequestAsOrder(request.value.id);
      actionSuccess.value = `Accepted. ${displayCode(order) || 'Order'} reserved live stock and is traceable in Sales and Logistics.`;
    } else {
      await ds.updateRequestStatus(request.value.id, status, note);
      actionSuccess.value = status === 'rejected'
        ? 'Rejected. Buyer can see the Sales observation.'
        : 'Adjustment requested. Logistics/Sales note is now in the request thread.';
    }
    actionNote.value = '';
  } catch (error) {
    actionError.value = error?.message || 'Action could not be completed.';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div v-if="!request" class="empty-state">
    <div class="empty-state-icon"><i class="pi pi-check-square"></i></div>
    <div class="empty-state-title">{{ loadingRequest ? 'Loading request...' : 'Request not found' }}</div>
    <button class="btn btn-primary" @click="router.push('/ops/commercial/purchase-requests')">Back to inbox</button>
  </div>

  <div v-else>
    <div class="page-header">
      <div>
        <div class="page-title">Sales Review</div>
        <div class="page-subtitle">{{ displayCode(request) }} · {{ ds.clientName(request.clientId) }}</div>
      </div>
      <span :class="'badge ' + requestStatusBadge(request.status)">{{ requestStatusLabel(request.status) }}</span>
    </div>

    <div v-if="actionSuccess" class="banner banner-success"><i class="pi pi-check-circle"></i><div>{{ actionSuccess }}</div></div>
    <div v-if="actionError" class="banner banner-danger"><i class="pi pi-exclamation-triangle"></i><div>{{ actionError }}</div></div>

    <div class="flow-grid-12 sales-review-grid">
      <section class="flow-panel span-7">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">Buyer request</div>
            <div class="flow-subtitle">Review items, delivery requirements and buyer notes before Sales response.</div>
          </div>
        </div>
        <div class="flow-panel-pad flow-stack">
          <div class="request-detail-meta">
            <div><span>Credit</span><strong :class="'badge ' + credit.badgeClass">{{ credit.statusLabel }}</strong></div>
            <div><span>Delivery</span><strong>{{ request.requestedDeliveryDate || 'Pending' }}</strong></div>
            <div><span>Priority</span><strong>{{ request.priority || 'normal' }}</strong></div>
            <div><span>Payment</span><strong>{{ request.paymentOption || client?.paymentCondition || 'N/A' }}</strong></div>
          </div>

          <article class="buyer-note">
            <strong>Buyer specifications</strong>
            <p>{{ request.comments || 'No buyer notes provided.' }}</p>
          </article>

          <div class="request-product-grid">
            <article v-for="item in items" :key="item.id || item.productId" class="request-product-card">
              <div class="request-product-image">
                <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" />
                <i v-else class="pi pi-box"></i>
              </div>
              <div>
                <strong>{{ item.name }}</strong>
                <span>{{ item.sku }}</span>
                <small>{{ item.quantity || item.qty }} {{ item.unit }} · S/ {{ item.price.toFixed(2) }}</small>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="flow-panel span-5">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">Sales response</div>
            <div class="flow-subtitle">Accept creates a traceable Sales order, reserves live stock and starts the Logistics handoff.</div>
          </div>
        </div>
        <div class="flow-panel-pad flow-stack">
          <div class="doc-chip-row">
            <span v-for="doc in requiredDocs" :key="doc" class="badge badge-blue">{{ doc }}</span>
          </div>
          <label class="field">
            <span class="field-label">Observation for B2B buyer / Logistics</span>
            <textarea v-model="actionNote" class="plain-input sales-note-box" rows="5" placeholder="Write product, stock, delivery or document notes here."></textarea>
          </label>
          <div v-if="canRespond" class="sales-action-grid">
            <button class="btn btn-primary" type="button" :disabled="saving" @click="runAction('approved')">
              <i class="pi pi-check"></i> Accept request
            </button>
            <button class="btn btn-secondary" type="button" :disabled="saving" @click="runAction('needs_adjustment')">
              <i class="pi pi-comments"></i> Need adjustments
            </button>
            <button class="btn btn-danger" type="button" :disabled="saving" @click="runAction('rejected')">
              <i class="pi pi-times"></i> Reject request
            </button>
          </div>
          <div v-else class="banner banner-info" style="margin:0">
            <i class="pi pi-lock"></i>
            <div>This request is closed for Sales actions. Use the generated order or buyer thread for follow-up.</div>
          </div>
        </div>
      </section>

      <section class="flow-panel span-12">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">Request chat</div>
            <div class="flow-subtitle">Shared thread for Buyer, Sales and Logistics coordination.</div>
          </div>
        </div>
        <div class="flow-panel-pad flow-stack">
          <div v-for="message in messages" :key="message.id" class="message-row">
            <div>
              <strong>{{ message.senderName || message.senderRole }}</strong>
              <span>{{ message.senderRole }}</span>
            </div>
            <p>{{ message.body }}</p>
          </div>
          <div v-if="!messages.length" class="empty-state compact">
            <div class="empty-state-title">No messages yet</div>
            <div class="empty-state-desc">Sales observations will appear here after an action.</div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.sales-review-grid { align-items: start; }
.request-detail-meta { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
.request-detail-meta div { border:1px solid #e8eef7; border-radius:14px; background:#f8fafc; padding:14px; }
.request-detail-meta span { display:block; color:#64748b; font-size:11px; font-weight:800; text-transform:uppercase; margin-bottom:6px; }
.buyer-note { border:1px solid #dbeafe; background:#eff6ff; border-radius:16px; padding:16px; }
.buyer-note strong { color:#0f172a; }
.buyer-note p { margin:8px 0 0; color:#334155; white-space:pre-line; line-height:1.5; }
.request-product-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
.request-product-card { display:grid; grid-template-columns:96px minmax(0,1fr); gap:14px; align-items:center; border:1px solid #e2e8f0; border-radius:16px; padding:12px; background:#fff; }
.request-product-image { width:96px; height:82px; display:flex; align-items:center; justify-content:center; border-radius:12px; background:#f8fafc; overflow:hidden; }
.request-product-image img { width:100%; height:100%; object-fit:contain; background:#fff; }
.request-product-image .pi { color:#94a3b8; font-size:28px; }
.request-product-card strong { display:block; color:#0f172a; line-height:1.25; }
.request-product-card span,.request-product-card small { display:block; color:#64748b; margin-top:4px; }
.doc-chip-row { display:flex; flex-wrap:wrap; gap:8px; }
.sales-note-box { min-height:132px; padding:12px; resize:vertical; }
.sales-action-grid { display:grid; gap:10px; }
.sales-action-grid .btn { justify-content:center; min-height:42px; }
.message-row { border:1px solid #e2e8f0; border-radius:14px; padding:14px 16px; background:#fff; }
.message-row div { display:flex; justify-content:space-between; gap:12px; color:#64748b; font-size:12px; }
.message-row div strong { color:#0f172a; }
.message-row p { margin:8px 0 0; color:#334155; line-height:1.5; white-space:pre-line; }
@media (max-width:860px){ .request-detail-meta,.request-product-grid { grid-template-columns:1fr; } }
</style>
