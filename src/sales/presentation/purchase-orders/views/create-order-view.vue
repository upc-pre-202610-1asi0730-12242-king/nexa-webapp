<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useDataStore } from '@/app/application/stores/data.store';
import { useCartStore } from '@/app/application/stores/cart.store';
import { useAuthStore } from '@/iam/application/iam.store';
import { creditSummary } from '@/shared/credit';
import { referenceDataApi } from '@/shared/infrastructure/reference-data-api';

const router = useRouter();
const toast = useToast();
const ds = useDataStore();
const cart = useCartStore();
const auth = useAuthStore();
const D = ds.D;
const manualOrderDraftKey = 'nexa.manualOrder.clientId';

const step = ref(1);
const steps = ['Client', 'Products', 'Delivery', 'Confirm'];
const clientSearch = ref('');
const manualClientId = ref('');
const selectedClient = ref(null);
const lines = ref([]);
const delivery = ref({
  date: minDeliveryISO(),
  addressType: 'Av.',
  address: '',
  district: '',
  city: '',
  province: '',
  reference: '',
  notes: '',
  dispatchNote: '',
  priority: 'medium',
});
const departments = ref([]);
const provinces = ref([]);
const districts = ref([]);
const locationError = ref('');
const cityOptions = computed(() => departments.value);
const provinceOptions = computed(() => provinces.value.filter(item => !delivery.value.city || item.parentCode === delivery.value.city));
const districtOptions = computed(() => districts.value.filter(item => !delivery.value.province || item.parentCode === delivery.value.province));
const canonicalWarehouse = computed(() =>
  D.warehouses.find(warehouse =>
    String(warehouse.name || '').includes('ICISA Lima Cold Hub') ||
    String(warehouse.location || warehouse.address || '').includes('Guillermo Dansey')
  ) || D.warehouses[0]
);
const warehouseOrigin = computed(() => {
  const warehouse = canonicalWarehouse.value;
  if (!warehouse) return '';
  const address = warehouse.location || warehouse.address || 'Av. Guillermo Dansey 2211, Cercado de Lima, Lima, Perú';
  return [warehouse.name || 'ICISA Lima Cold Hub', address].filter(Boolean).join(', ');
});

function minDeliveryISO() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function pickClient(c) {
  selectedClient.value = c;
  const parsedAddress = splitStreetAddress(c.address);
  delivery.value.addressType = parsedAddress.type;
  delivery.value.address = parsedAddress.line;
  delivery.value.province = referenceCode(provinces.value, c.province);
  const province = provinces.value.find(item => item.code === delivery.value.province);
  delivery.value.city = province?.parentCode || '';
  delivery.value.district = referenceCode(districts.value, c.district);
  delivery.value.reference = c.reference || '';
  localStorage.setItem(manualOrderDraftKey, c.id);
}
function splitStreetAddress(value = '') {
  const address = String(value).trim();
  const match = address.match(/^(av(?:enida)?\.?|jr\.?|jir[oó]n|calle)\s+/i);
  if (!match) return { type: 'Av.', line: address };
  const key = match[1].toLowerCase();
  const type = key.startsWith('jr') || key.startsWith('jir') ? 'Jr.' : key.startsWith('calle') ? 'Calle' : 'Av.';
  return { type, line: address.slice(match[0].length).trim() };
}
function referenceCode(rows, value) {
  const normalized = String(value || '').trim().toLowerCase();
  return rows.find(item => item.code === value || String(item.label).toLowerCase() === normalized)?.code || '';
}
function referenceLabel(rows, code) {
  return rows.find(item => item.code === code)?.label || code;
}
function selectCity() {
  if (!provinceOptions.value.some(item => item.code === delivery.value.province)) {
    delivery.value.province = '';
    delivery.value.district = '';
  }
}
function selectProvince() {
  if (!districtOptions.value.some(item => item.code === delivery.value.district)) delivery.value.district = '';
}
function proceedToProducts() {
  if (!selectedClient.value || isCreditBlocked.value) return;
  step.value = 2;
}
function orderCreationErrorMessage(error) {
  const data = error?.response?.data;
  return data?.detail || data?.message || data?.title || error?.message || 'Nexa did not accept the order request.';
}
function clientDisplayName(client) {
  return client?.businessName || client?.commercialName || client?.name || client?.id || 'B2B client';
}
function clientPrimaryContact(client) {
  return D.clientContacts.find(contact => contact.clientId === client.id) || {};
}
function clientCreditSnapshot(client) {
  return creditSummary(client || {});
}
function clientSelectionMeta(client) {
  const credit = clientCreditSnapshot(client);
  if (['blocked', 'overdue'].includes(credit.status)) return { label: 'Credit blocked', tone: 'danger' };
  if (credit.limit && credit.percent >= 80) return { label: `${credit.percent}% credit used`, tone: 'warning' };
  if (client.status !== 'active') return { label: 'Observed client', tone: 'warning' };
  return { label: 'Ready for order', tone: 'success' };
}
const isCreditBlocked = computed(() => {
  const credit = creditSummary(selectedClient.value || {});
  return ['blocked', 'overdue'].includes(credit.status) || (credit.limit > 0 && credit.available < total.value);
});
const selectedCredit = computed(() => creditSummary(selectedClient.value || {}));
const selectedClientState = computed(() => {
  const c = selectedClient.value;
  if (!c) return { tone: 'neutral', label: 'No client selected', message: 'Select a client to validate Sales conditions.' };
  if (isCreditBlocked.value) {
    return { tone: 'danger', label: 'Blocked', message: 'Credit limit is exhausted. Order cannot continue.' };
  }
  if (selectedCredit.value.percent >= 80) {
    return { tone: 'warning', label: 'Review credit', message: 'Credit usage is high. Confirm condition before order entry.' };
  }
  if (c.status !== 'active') {
    return { tone: 'warning', label: 'Observed', message: 'Client is observed. Review Sales notes before confirming.' };
  }
  return { tone: 'success', label: 'Validated', message: 'Client can continue to product selection.' };
});
const filteredClients = computed(() => {
  const q = clientSearch.value.trim().toLowerCase();
  if (!q) return D.clients;
  return D.clients.filter(client => {
    const primaryContact = D.clientContacts.find(contact => contact.clientId === client.id);
    return [
      client.name,
      client.businessName,
      client.commercialName,
      client.ruc,
      client.contact,
      primaryContact?.name,
      primaryContact?.email,
    ].filter(Boolean).some(value => String(value).toLowerCase().includes(q));
  });
});
const manualClient = computed(() => {
  const id = manualClientId.value.trim();
  if (!id) return null;
  return {
    id,
    name: id,
    status: 'active',
    condition: 'Direct customer identifier',
    type: 'Direct order customer',
    address: '',
  };
});
function addLine(p) {
  const max = Math.max(0, p.stock - p.reserved);
  if (!max) return;
  const existing = lines.value.find(l => l.productId === p.id);
  if (existing) existing.qty = Math.min(existing.qty + 1, existing.max);
  else lines.value.push({ productId: p.id, qty: 1, price: p.price, name: p.name, unit: p.unit, imageUrl: p.imageUrl, max });
}
function removeLine(id) {
  cart.remove(id);
  lines.value = lines.value.filter(l => l.productId !== id);
}
function lineProduct(line) { return ds.productById(line.productId) || line; }
function syncLinesFromCart() {
  lines.value = cart.items.map(item => {
    const product = ds.productById(item.productId) || item;
    const max = Math.max(0, Number(product.stock || 0) - Number(product.reserved || 0)) || item.max || item.qty;
    return {
      productId: item.productId,
      qty: Math.min(item.qty, max),
      price: item.price,
      name: item.name,
      unit: item.unit,
      imageUrl: product.imageUrl || item.imageUrl,
      max,
    };
  });
}
const total = computed(() => lines.value.reduce((s, l) => s + l.price * l.qty, 0));
const shippingCost = computed(() => total.value > 0 ? Math.max(18, Math.min(85, total.value * 0.035)) : 0);
const grandTotal = computed(() => total.value + shippingCost.value);
const shippingEta = computed(() => delivery.value.date || 'Pending');
const hasInvalidLines = computed(() => lines.value.some(l => !l.qty || l.qty < 1 || l.qty > l.max));
function setLineQuantity(line, quantity) {
  line.qty = Math.max(1, Math.min(line.max, Number(quantity || 1)));
}
const deliveryDateWarning = computed(() => {
  if (!delivery.value.date) return 'Delivery date is required.';
  const selected = new Date(`${delivery.value.date}T00:00:00`);
  const minimum = new Date(`${minDeliveryISO()}T00:00:00`);
  if (selected < minimum) return 'Delivery date must be at least 3 days after order creation.';
  return '';
});
const canConfirmOrder = computed(() =>
  !!selectedClient.value &&
  !!lines.value.length &&
  !hasInvalidLines.value &&
  !deliveryDateWarning.value &&
  !!delivery.value.city &&
  !!delivery.value.province &&
  !!delivery.value.district &&
  !!delivery.value.address.trim() &&
  !isCreditBlocked.value
);
const deliveryDestination = computed(() => [
  [delivery.value.addressType, delivery.value.address].filter(Boolean).join(' '),
  referenceLabel(districts.value, delivery.value.district),
  referenceLabel(provinces.value, delivery.value.province),
  referenceLabel(departments.value, delivery.value.city),
  'Peru',
].filter(Boolean).join(', '));
const deliveryAddressReady = computed(() => Boolean(
  warehouseOrigin.value && delivery.value.address.trim() && delivery.value.city && delivery.value.province && delivery.value.district
));
const encodedDeliveryAddress = computed(() => encodeURIComponent(deliveryDestination.value));
const encodedWarehouseOrigin = computed(() => encodeURIComponent(warehouseOrigin.value));
const mapEmbedUrl = computed(() => `https://maps.google.com/maps?saddr=${encodedWarehouseOrigin.value}&daddr=${encodedDeliveryAddress.value}&hl=es&z=13&output=embed`);
const mapDirectionsUrl = computed(() => `https://www.google.com/maps/dir/?api=1&origin=${encodedWarehouseOrigin.value}&destination=${encodedDeliveryAddress.value}&travelmode=driving`);
const totalUnits = computed(() => lines.value.reduce((sum, line) => sum + Number(line.qty || 0), 0));
const reviewPriorityLabel = computed(() => ({
  low: 'Low priority',
  medium: 'Medium priority',
  high: 'High priority',
}[delivery.value.priority] || delivery.value.priority));
const reviewChecks = computed(() => [
  { icon: 'pi-user', label: 'Client validated', value: selectedClient?.value?.commercialName || selectedClient?.value?.businessName || selectedClient?.value?.name || 'Pending', ok: !!selectedClient.value },
  { icon: 'pi-box', label: 'Products selected', value: `${lines.value.length} SKUs / ${totalUnits.value} units`, ok: !!lines.value.length && !hasInvalidLines.value },
  { icon: 'pi-map-marker', label: 'Delivery route', value: deliveryDestination.value || 'Pending', ok: deliveryAddressReady.value },
  { icon: 'pi-calendar', label: 'Requested date', value: delivery.value.date || 'Pending', ok: !deliveryDateWarning.value },
]);
watch(() => cart.items, syncLinesFromCart, { deep: true, immediate: true });
watch(() => cart.items.length, count => {
  if (count && selectedClient.value && step.value < 2) step.value = 2;
});
onMounted(async () => {
  try {
    [departments.value, provinces.value, districts.value] = await Promise.all([
      referenceDataApi.get('departments'),
      referenceDataApi.get('provinces'),
      referenceDataApi.get('districts'),
    ]);
  } catch (error) {
    locationError.value = error?.message || 'Delivery locations are unavailable.';
  }
  const savedClientId = localStorage.getItem(manualOrderDraftKey);
  const savedClient = savedClientId ? D.clients.find(client => client.id === savedClientId) : null;
  if (!savedClient) return;
  pickClient(savedClient);
  if (cart.items.length) step.value = 2;
});
async function confirm() {
  if (!canConfirmOrder.value) {
    toast.add({ severity: 'warn', summary: 'Review order data', detail: deliveryDateWarning.value || 'Client, stock and quantities must be valid.', life: 3500 });
    return;
  }
  const newId = ds.nextOrderId();
  const today = new Date().toISOString().slice(0, 10);
  try {
    const created = await ds.addOrder({
      id:       newId,
      code:     newId,
      clientId: selectedClient.value.id,
      clientAccountId: selectedClient.value.backendId,
      status:   'pending',
      priority: delivery.value.priority,
      date:     today,
      items:    lines.value.map(l => ({
        productId: l.productId,
        catalogItemId: ds.productById(l.productId)?.catalogItemId,
        itemName: l.name,
        qty:       l.qty,
        price:     l.price,
        stockOk:   l.qty <= l.max,
      })),
      total:  total.value,
      shippingEstimate: shippingCost.value,
      notes: delivery.value.notes,
      delivery: {
        addressType: delivery.value.addressType,
        address: delivery.value.address,
        district: referenceLabel(districts.value, delivery.value.district),
        city: referenceLabel(departments.value, delivery.value.city),
        province: referenceLabel(provinces.value, delivery.value.province),
        reference: delivery.value.reference,
        requestedDate: delivery.value.date,
        dispatchNote: delivery.value.dispatchNote,
      },
      source: 'manual_order_entry',
      createdBy: auth.user?.id || null,
      createdByName: auth.user?.name || '',
      createdByRole: auth.user?.roleName || '',
      createdByRoleKey: auth.user?.roleKey || '',
    });
    cart.clear();
    localStorage.removeItem(manualOrderDraftKey);
    toast.add({ severity: 'success', summary: 'Purchase order created', detail: `${created.id} - pending`, life: 3500 });
    router.push(`/ops/commercial/purchase-orders/${created.id}`);
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Order was not created', detail: orderCreationErrorMessage(error), life: 5000 });
  }
}
</script>

<template>
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
    <button class="btn btn-ghost btn-sm" @click="router.push('/ops/commercial/purchase-orders')"><i class="pi pi-arrow-left"></i> Purchase Orders</button>
    <div style="flex:1">
      <div class="page-title">Manual Order Entry</div>
      <div class="page-subtitle">{{ D.company.name }}</div>
    </div>
  </div>

  <!-- Stepper -->
  <div class="stepper">
    <template v-for="(s, idx) in steps" :key="s">
      <div class="step-item" :class="step === idx + 1 ? 'step-active' : step > idx + 1 ? 'step-done' : 'step-pending'">
        <div class="step-circle"><i v-if="step > idx + 1" class="pi pi-check"></i><span v-else>{{ idx + 1 }}</span></div>
        <div class="step-label">{{ s }}</div>
      </div>
      <div v-if="idx < steps.length - 1" class="step-connector" :class="step > idx + 1 ? 'step-connector-done' : 'step-connector-pending'"></div>
    </template>
  </div>

  <!-- STEP 1: Client -->
  <div v-if="step === 1">
    <div class="card-title" style="margin-bottom:12px">Select Client</div>
    <div class="manual-order-client-grid">
      <div class="grid-1" style="display:flex;flex-direction:column;gap:10px">
        <div class="search-input" style="width:100%;min-width:0">
          <i class="pi pi-search"></i>
          <input v-model="clientSearch" placeholder="Search by company name or RUC" aria-label="Search by company name or RUC" />
        </div>
        <div v-if="!D.clients.length" class="card card-pad">
          <div class="banner banner-info" style="margin-bottom:12px">
            <i class="pi pi-info-circle"></i>
            <div>Client account lookup is not available for this workspace. Enter a customer identifier to create an order through the Orders API.</div>
          </div>
          <label class="field">
            <span class="field-label">Customer identifier</span>
            <input class="plain-input" v-model="manualClientId" placeholder="CUS-0001 or CLI-001" />
          </label>
          <button class="btn btn-primary" style="margin-top:12px;width:100%;justify-content:center" :disabled="!manualClient" @click="pickClient(manualClient)">
            Use customer identifier
          </button>
        </div>
        <div v-else-if="!filteredClients.length" class="empty-state" style="padding:28px">
          <div class="empty-state-icon"><i class="pi pi-search"></i></div>
          <div class="empty-state-title">No clients found.</div>
        </div>
        <button
          v-for="c in filteredClients"
          :key="c.id"
          class="nexa-select-card manual-client-select-card"
          :class="{ active: selectedClient?.id === c.id }"
          type="button"
          @click="pickClient(c)"
        >
          <i class="pi pi-building"></i>
          <span class="manual-client-body">
            <div class="manual-client-top">
              <strong>{{ clientDisplayName(c) }}</strong>
              <i v-if="selectedClient?.id === c.id" class="pi pi-check-circle"></i>
            </div>
            <small>{{ c.ruc || 'No RUC' }} · {{ c.type || c.segment || 'B2B account' }}</small>
            <div class="manual-client-meta">
              <span><i class="pi pi-user"></i> {{ clientPrimaryContact(c).name || c.contact || 'Contact pending' }}</span>
              <span><i class="pi pi-phone"></i> {{ c.phone || clientPrimaryContact(c).phone || 'No phone' }}</span>
              <span><i class="pi pi-map-marker"></i> {{ c.district || c.address || 'Address pending' }}</span>
            </div>
            <div class="manual-client-footer">
              <span :class="'badge ' + (c.status === 'active' ? 'badge-green' : 'badge-amber')">{{ c.status === 'active' ? 'Active' : 'Observed' }}</span>
              <span :class="'manual-client-credit ' + clientSelectionMeta(c).tone">{{ clientSelectionMeta(c).label }}</span>
              <span v-if="clientCreditSnapshot(c).limit" class="manual-client-amount">Available S/ {{ clientCreditSnapshot(c).available.toLocaleString() }}</span>
            </div>
          </span>
        </button>
      </div>

      <!-- Conditions card (sticky) -->
      <div style="position:sticky;top:24px">
        <div v-if="!selectedClient" class="card card-pad" style="text-align:center;color:#9CA3AF">
          <div style="font-size:32px;margin-bottom:12px"><i class="pi pi-user"></i></div>
          <div style="font-size:13px">Select a client to view Sales conditions</div>
        </div>

        <template v-else>
          <div class="card card-pad" style="margin-bottom:12px">
            <div style="font-size:10px;font-weight:700;color:#2563EB;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px;display:flex;align-items:center;gap:5px">
              <i class="pi pi-file-edit"></i> Sales Conditions
            </div>
            <div
              :class="'banner ' + (selectedClientState.tone === 'danger' ? 'banner-danger' : selectedClientState.tone === 'warning' ? 'banner-warning' : selectedClientState.tone === 'success' ? 'banner-success' : 'banner-info')"
              style="margin-bottom:12px"
            >
              <i :class="'pi ' + (selectedClientState.tone === 'danger' ? 'pi-times-circle' : selectedClientState.tone === 'warning' ? 'pi-exclamation-triangle' : 'pi-check-circle')"></i>
              <div>
                <strong>{{ selectedClientState.label }}.</strong> {{ selectedClientState.message }}
              </div>
            </div>

            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px">
              <span style="color:#6B7280">Payment Condition</span>
              <span style="font-weight:600">{{ selectedClient.condition }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px">
              <span style="color:#6B7280">Client Type</span>
              <span style="font-weight:600">{{ selectedClient.type }}</span>
            </div>

            <template v-if="selectedCredit.limit">
              <div class="divider" style="margin:10px 0"></div>
              <div style="font-size:10px;font-weight:600;color:#6B7280;text-transform:uppercase;margin-bottom:6px">Monthly Credit</div>
              <div style="display:flex;justify-content:space-between;font-size:11px;color:#6B7280;margin-bottom:4px">
                <span>Used: S/ {{ selectedCredit.used.toLocaleString() }}</span>
                <span>Available: S/ {{ selectedCredit.available.toLocaleString() }}</span>
              </div>
              <div class="credit-bar-wrap" style="margin-bottom:6px">
                <div class="credit-bar" :style="{ width: selectedCredit.percent + '%', background: selectedCredit.barColor }"></div>
              </div>
              <div class="flow-note">Period {{ selectedCredit.period }} - due {{ selectedCredit.dueDate }}</div>
              <div v-if="isCreditBlocked" class="banner banner-danger" style="margin-top:8px">
                <i class="pi pi-times-circle"></i>
                <div>Monthly credit is blocked, overdue or insufficient for this order.</div>
              </div>
              <div v-else-if="selectedCredit.percent >= 80" class="banner banner-warning" style="margin-top:8px">
                <i class="pi pi-exclamation-triangle"></i>
                <div>Credit at {{ selectedCredit.percent }}%. Verify before confirming.</div>
              </div>
            </template>
            <template v-else>
              <div class="divider" style="margin:10px 0"></div>
              <div style="font-size:12px;color:#6B7280;display:flex;align-items:center;gap:5px">
                <i class="pi pi-credit-card"></i> Cash client
              </div>
            </template>
          </div>

          <button
            class="btn btn-primary"
            style="width:100%;justify-content:center"
            :disabled="isCreditBlocked"
            @click="proceedToProducts"
          >
            Continue <i class="pi pi-arrow-right"></i>
          </button>
        </template>
      </div>
    </div>
  </div>

  <!-- STEP 2: Products -->
  <div v-if="step === 2">
    <div class="card-title" style="margin-bottom:12px">Add Products for {{ selectedClient?.name }}</div>
    <div class="create-order-grid">
      <div class="card card-pad catalog-picker-card">
        <div class="catalog-picker-icon"><i class="pi pi-box"></i></div>
        <div>
          <div class="card-title">Product catalog selector</div>
          <p>Use the shared catalog to add items. Selected products return here automatically in the order summary.</p>
        </div>
        <button class="btn btn-primary" type="button" @click="router.push('/ops/product-catalog')">
          <i class="pi pi-arrow-up-right"></i> Open product catalog
        </button>
      </div>
      <div class="card card-pad" style="position:sticky;top:24px">
        <div class="card-title" style="margin-bottom:12px">Summary ({{ lines.length }} items)</div>
        <div v-if="!lines.length" class="empty-state" style="padding:24px">
          <div class="empty-state-icon"><i class="pi pi-shopping-cart"></i></div>
          <div class="empty-state-title">No products yet</div>
          <div class="empty-state-desc">Select products from the catalog to build the purchase order</div>
        </div>
        <template v-else>
          <div v-for="l in lines" :key="l.productId" class="manual-line-row">
            <img v-if="lineProduct(l).imageUrl" class="manual-line-image" :src="lineProduct(l).imageUrl" :alt="l.name" loading="lazy" />
            <div v-else class="manual-line-image manual-line-image-empty"><i class="pi pi-box"></i></div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:500">{{ l.name }}</div>
              <div style="font-size:11px;color:#9CA3AF">S/ {{ l.price.toFixed(2) }} / {{ l.unit }}</div>
            </div>
            <input type="number" v-model.number="l.qty" :max="l.max" min="1" style="width:50px;border:1px solid #E5E7EB;border-radius:6px;padding:4px;font-size:13px;text-align:center" />
            <button class="btn btn-ghost btn-sm" @click="removeLine(l.productId)"><i class="pi pi-trash"></i></button>
          </div>
          <div style="display:flex;justify-content:space-between;font-weight:700;font-size:15px;margin-top:12px;padding-top:12px;border-top:2px solid #E5E7EB">
            <span>Total</span><span>S/ {{ total.toFixed(2) }}</span>
          </div>
          <div v-if="hasInvalidLines" class="banner banner-danger" style="margin-top:12px">
            <i class="pi pi-exclamation-triangle"></i>
            <div>Adjust quantities: they cannot exceed available stock.</div>
          </div>
          <button class="btn btn-primary" style="width:100%;margin-top:16px;justify-content:center" :disabled="hasInvalidLines" @click="step = 3">Continue to Delivery</button>
        </template>
      </div>
    </div>
  </div>

  <!-- STEP 3: Delivery -->
  <div v-if="step === 3">
    <div class="delivery-grid">
      <div class="card card-pad delivery-form-card">
        <div class="card-title" style="margin-bottom:16px">Delivery Information</div>
        <div class="field" style="margin-bottom:14px">
          <div class="field-label">Delivery Date</div>
          <div class="field-input"><i class="pi pi-calendar"></i><input type="date" v-model="delivery.date" :min="minDeliveryISO()" /></div>
          <div v-if="deliveryDateWarning" class="field-error">{{ deliveryDateWarning }}</div>
        </div>
        <div v-if="locationError" class="banner banner-danger" role="alert">{{ locationError }}</div>
        <div class="manual-delivery-grid">
          <label class="field">
            <span class="field-label">City</span>
            <select v-model="delivery.city" class="plain-input" @change="selectCity">
              <option value="">Select city</option>
              <option v-for="item in cityOptions" :key="item.code" :value="item.code">{{ item.label }}</option>
            </select>
          </label>
          <label class="field">
            <span class="field-label">Province</span>
            <select v-model="delivery.province" class="plain-input" :disabled="!delivery.city" @change="selectProvince">
              <option value="">Select province</option>
              <option v-for="item in provinceOptions" :key="item.code" :value="item.code">{{ item.label }}</option>
            </select>
          </label>
          <label class="field">
            <span class="field-label">District</span>
            <select v-model="delivery.district" class="plain-input" :disabled="!delivery.province">
              <option value="">Select district</option>
              <option v-for="item in districtOptions" :key="item.code" :value="item.code">{{ item.label }}</option>
            </select>
          </label>
          <label class="field">
            <span class="field-label">Reference</span>
            <input v-model="delivery.reference" class="plain-input" placeholder="Gate, dock, receiver, cold room" />
          </label>
        </div>
        <div class="field" style="margin-bottom:14px">
          <div class="field-label">Street type and address</div>
          <div class="address-line">
            <select v-model="delivery.addressType" class="plain-input address-type"><option value="Av.">Av.</option><option value="Calle">Calle</option><option value="Jr.">Jr.</option></select>
            <div class="field-input"><i class="pi pi-map-marker"></i><input type="text" v-model="delivery.address" placeholder="Street and number" /></div>
          </div>
        </div>
        <div class="field" style="margin-bottom:14px">
          <div class="field-label">Priority</div>
          <div class="nexa-select-grid priority-select-grid">
            <button class="nexa-select-card" :class="{ active: delivery.priority === 'low' }" type="button" @click="delivery.priority = 'low'">
              <i class="pi pi-clock"></i>
              <span><strong>Low</strong><small>Standard route window.</small></span>
            </button>
            <button class="nexa-select-card" :class="{ active: delivery.priority === 'medium' }" type="button" @click="delivery.priority = 'medium'">
              <i class="pi pi-truck"></i>
              <span><strong>Medium</strong><small>Normal cold-chain dispatch.</small></span>
            </button>
            <button class="nexa-select-card" :class="{ active: delivery.priority === 'high' }" type="button" @click="delivery.priority = 'high'">
              <i class="pi pi-bolt"></i>
              <span><strong>High</strong><small>Priority Sales route.</small></span>
            </button>
          </div>
        </div>
        <div class="field" style="margin-bottom:14px">
          <div class="field-label">Notes (optional)</div>
          <div class="field-input" style="align-items:flex-start"><i class="pi pi-pencil" style="margin-top:2px"></i>
            <textarea v-model="delivery.notes" rows="3" style="border:none;outline:none;font-size:13px;flex:1;background:transparent;resize:none" placeholder="Instructions for the driver..."></textarea>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:20px">
          <button class="btn btn-ghost" @click="step = 2"><i class="pi pi-arrow-left"></i> Back</button>
          <button class="btn btn-primary" style="flex:1;justify-content:center" :disabled="!!deliveryDateWarning || !deliveryAddressReady" @click="step = 4">Continue to Review</button>
        </div>
      </div>
      <aside class="card card-pad route-map-card">
        <div class="route-map-head">
          <div>
            <div class="card-title">Route preview</div>
            <p>Map centers on the selected delivery destination. Open map shows the driving route from the active warehouse.</p>
          </div>
          <a v-if="deliveryAddressReady" class="btn btn-secondary btn-sm" :href="mapDirectionsUrl" target="_blank" rel="noopener noreferrer">
            <i class="pi pi-external-link"></i> Open map
          </a>
        </div>
        <div class="route-summary">
          <span><i class="pi pi-warehouse"></i> {{ warehouseOrigin || 'Warehouse origin unavailable' }}</span>
          <span><i class="pi pi-map-marker"></i> {{ deliveryDestination || 'Delivery address pending' }}</span>
        </div>
        <iframe
          v-if="deliveryAddressReady"
          class="route-map-frame"
          title="Google Maps delivery route"
          :src="mapEmbedUrl"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
        <div v-else class="empty-state compact">Complete city, province, district and address to preview the route.</div>
        <small class="flow-note">Map is an external Google Maps embed. Delivery address, route reference and dispatch trace are stored in Nexa when the order enters operations.</small>
      </aside>
    </div>
  </div>

  <!-- STEP 4: Confirm -->
  <div v-if="step === 4">
    <section class="order-review-hero">
      <div>
        <span class="eyebrow">Order review</span>
        <h2>Confirm cold-chain purchase order</h2>
        <p>{{ selectedClient?.commercialName || selectedClient?.businessName || selectedClient?.name }} · {{ deliveryDestination }}</p>
      </div>
      <div class="order-review-total">
        <span>Total</span>
        <strong>S/ {{ grandTotal.toFixed(2) }}</strong>
        <small>{{ lines.length }} SKUs · {{ totalUnits }} units</small>
      </div>
    </section>

    <div class="order-review-grid">
      <section class="flow-panel span-8">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">Products and totals</div>
            <div class="flow-subtitle">Final quantities from catalog selection before Sales confirmation.</div>
          </div>
          <span class="flow-pill flow-pill-blue">{{ reviewPriorityLabel }}</span>
        </div>
        <div class="flow-panel-pad review-lines">
          <div v-for="l in lines" :key="l.productId" class="review-line-card">
            <div class="confirm-item">
              <img v-if="lineProduct(l).imageUrl" class="manual-line-image" :src="lineProduct(l).imageUrl" :alt="l.name" loading="lazy" />
              <div v-else class="manual-line-image manual-line-image-empty"><i class="pi pi-box"></i></div>
              <span>{{ l.name }} <small>S/ {{ l.price.toFixed(2) }} / {{ l.unit }} · {{ l.max }} available</small></span>
            </div>
            <div class="review-line-controls">
              <button class="btn btn-ghost btn-sm" type="button" @click="setLineQuantity(l, l.qty - 1)">-</button>
              <input class="qty-input" type="number" min="1" :max="l.max" :value="l.qty" @input="setLineQuantity(l, $event.target.value)" />
              <button class="btn btn-ghost btn-sm" type="button" @click="setLineQuantity(l, l.qty + 1)">+</button>
              <strong>S/ {{ (l.qty * l.price).toFixed(2) }}</strong>
            </div>
          </div>
          <div class="review-total-row">
            <span>Products</span><strong>S/ {{ total.toFixed(2) }}</strong>
            <span>Shipping</span><strong>S/ {{ shippingCost.toFixed(2) }}</strong>
            <span>Delivery ETA</span><strong>{{ shippingEta }}</strong>
            <span>Order total</span><strong>S/ {{ grandTotal.toFixed(2) }}</strong>
          </div>
        </div>
      </section>

      <aside class="flow-panel span-4">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">Confirmation details</div>
            <div class="flow-subtitle">Editable fields keep their position before saving.</div>
          </div>
        </div>
        <div class="flow-panel-pad flow-stack">
          <div v-for="check in reviewChecks" :key="check.label" class="review-check" :class="{ ok: check.ok }">
            <i :class="'pi ' + check.icon"></i>
            <span><strong>{{ check.label }}</strong><small>{{ check.value }}</small></span>
          </div>
          <label class="field"><span class="field-label">Priority</span><select v-model="delivery.priority" class="plain-input"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
          <label class="field"><span class="field-label">Dispatch note</span><textarea v-model="delivery.dispatchNote" class="plain-input" rows="3" placeholder="Cold-chain, receiver, dock, or route notes"></textarea></label>
          <div v-if="delivery.notes" class="review-note"><strong>Driver notes</strong><span>{{ delivery.notes }}</span></div>
          <div class="banner banner-info" style="margin:0">
            <i class="pi pi-info-circle"></i>
            <div>Order will be stored in Nexa and become visible to Sales, Logistics and Buyer Portal according to tenant access.</div>
          </div>
          <div v-if="!canConfirmOrder" class="banner banner-warning" style="margin:0">
            <i class="pi pi-exclamation-triangle"></i>
            <div>{{ deliveryDateWarning || 'Review client, quantities and available stock before confirming.' }}</div>
          </div>
          <div class="review-actions">
            <button class="btn btn-ghost" @click="step = 2"><i class="pi pi-arrow-left"></i> Back to products</button>
            <button class="btn btn-primary" :disabled="!canConfirmOrder" @click="confirm"><i class="pi pi-check"></i> Confirm Purchase Order</button>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.create-order-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.manual-client-select-card {
  min-height: 150px;
  align-items: flex-start;
  color: #334155;
}
.manual-client-select-card > .pi:first-child {
  margin-top: 2px;
}
.manual-client-body {
  display: grid;
  gap: 8px;
}
.manual-client-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.manual-client-top strong {
  font-size: 15px;
  line-height: 1.3;
}
.manual-client-top i {
  flex-shrink: 0;
  color: #2563eb;
  font-size: 16px;
}
.manual-client-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}
.manual-client-meta span {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: initial;
}
.manual-client-meta i {
  color: #2563eb;
  font-size: 11px;
}
.manual-client-footer {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}
.manual-client-footer > span {
  flex: initial;
}
.manual-client-credit,
.manual-client-amount {
  display: inline-flex;
  min-height: 24px;
  align-items: center;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 900;
}
.manual-client-credit.success {
  background: #dcfce7;
  color: #15803d;
}
.manual-client-credit.warning {
  background: #fef3c7;
  color: #b45309;
}
.manual-client-credit.danger {
  background: #fee2e2;
  color: #b91c1c;
}
.manual-client-amount {
  background: #eff6ff;
  color: #1d4ed8;
}
.catalog-picker-card {
  min-height: 260px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 16px;
  text-align: center;
  border-style: dashed;
}
.catalog-picker-card p {
  max-width: 520px;
  margin: 6px auto 0;
  color: #64748b;
  line-height: 1.55;
}
.catalog-picker-icon {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 22px;
}
.manual-line-row {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e8eef7;
}
.manual-line-image {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  object-fit: cover;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}
.manual-line-image-empty {
  display: grid;
  place-items: center;
  color: #94a3b8;
}
.address-line {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 10px;
}
.address-type {
  min-height: 42px;
}
.confirm-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.confirm-item span {
  display: grid;
  gap: 3px;
}
.confirm-item small {
  color: #64748b;
}
.delivery-grid {
  display: grid;
  grid-template-columns: minmax(360px, .85fr) minmax(0, 1.35fr);
  gap: 16px;
  align-items: start;
}
.delivery-form-card,
.route-map-card {
  border-radius: 8px;
}
.manual-delivery-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}
.priority-select-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.priority-select-grid .nexa-select-card {
  min-height: 104px;
  align-items: center;
  padding: 18px;
}
.priority-select-grid .nexa-select-card i {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #eff6ff;
  color: #1d4ed8;
}
.priority-select-grid .nexa-select-card span {
  display: grid;
  gap: 5px;
}
.priority-select-grid .nexa-select-card strong {
  color: #0f172a;
  font-size: 15px;
}
.priority-select-grid .nexa-select-card small {
  color: #64748b;
  line-height: 1.35;
}
.priority-select-grid .nexa-select-card.active {
  border-color: #2563eb;
  background: #eff6ff;
}
.order-review-hero {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: stretch;
  margin-bottom: 16px;
  padding: 24px;
  border: 1px solid #bfdbfe;
  border-radius: 18px;
  background: #eff6ff;
}
.order-review-hero h2 {
  margin: 4px 0 6px;
  color: #0f172a;
  font-size: 26px;
}
.order-review-hero p {
  margin: 0;
  color: #475569;
  line-height: 1.45;
}
.order-review-total {
  min-width: 220px;
  display: grid;
  gap: 4px;
  align-content: center;
  padding: 16px 18px;
  border: 1px solid #bfdbfe;
  border-radius: 16px;
  background: #fff;
}
.order-review-total span,
.order-review-total small {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}
.order-review-total strong {
  color: #1d4ed8;
  font-size: 30px;
  line-height: 1;
}
.order-review-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}
.span-8 { grid-column: span 8; }
.span-4 { grid-column: span 4; }
.review-lines {
  display: grid;
  gap: 10px;
}
.review-line-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
}
.review-line-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
.review-line-controls .qty-input {
  width: 64px;
}
.review-total-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px 18px;
  align-items: center;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid #bfdbfe;
  background: linear-gradient(180deg, #ffffff 0%, #eff6ff 100%);
  color: #0f172a;
  font-weight: 900;
}
.review-total-row span {
  color: #64748b;
}
.review-total-row strong {
  color: #1d4ed8;
}
.review-total-row span:last-of-type,
.review-total-row strong:last-of-type {
  margin-top: 4px;
  padding-top: 10px;
  border-top: 1px solid #bfdbfe;
  font-size: 16px;
}
.review-check {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #f8fafc;
}
.review-check.ok {
  border-color: #bbf7d0;
  background: #f0fdf4;
}
.review-check i {
  color: #1d4ed8;
  margin-top: 2px;
}
.review-check span {
  display: grid;
  gap: 3px;
}
.review-check small,
.review-note span {
  color: #64748b;
  line-height: 1.4;
}
.review-note {
  display: grid;
  gap: 4px;
  padding: 12px;
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: #eff6ff;
}
.review-actions {
  display: flex;
  gap: 8px;
}
.review-actions .btn-primary {
  flex: 1;
  justify-content: center;
}
.route-map-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 12px;
}
.route-map-head p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.45;
}
.route-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}
.route-summary span {
  min-height: 38px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 11px;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  background: #eff6ff;
  color: #1e3a8a;
  font-size: 12px;
  font-weight: 800;
}
.route-map-frame {
  width: 100%;
  min-height: 420px;
  border: 1px solid #dbe5f2;
  border-radius: 16px;
  background: #f8fafc;
}
@media (max-width: 1024px) {
  .create-order-grid,
  .delivery-grid,
  .order-review-grid {
    grid-template-columns: 1fr;
  }
  .span-8,
  .span-4 {
    grid-column: 1 / -1;
  }
  .order-review-hero {
    flex-direction: column;
  }
  .route-summary {
    grid-template-columns: 1fr;
  }
  .manual-delivery-grid,
  .priority-select-grid {
    grid-template-columns: 1fr;
  }
}
</style>
