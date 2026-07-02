<script setup>
import { computed, ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/iam/application/iam.store';
import { useCartStore } from '@/app/application/stores/cart.store';
import { useDataStore } from '@/app/application/stores/data.store';
import { referenceDataApi } from '@/shared/infrastructure/reference-data-api';

const router = useRouter();
const { t, locale } = useI18n();
const auth = useAuthStore();
const cart = useCartStore();
const ds = useDataStore();
const step = ref(cart.items.length ? 2 : 1);
const steps = computed(() => [
  t('buyerRequestBuilder.steps.buyer'),
  t('buyerRequestBuilder.steps.products'),
  t('buyerRequestBuilder.steps.delivery'),
  t('buyerRequestBuilder.steps.confirm'),
]);
const requestedDeliveryDate = ref(datePlusISO(3));
const comments = ref('');
const district = ref('');
const province = ref('');
const city = ref('');
const addressType = ref('Av.');
const addressLine = ref('');
const reference = ref('');
const paymentMode = ref('credit_line');
const deliveryMode = ref('manual');
const currentLocation = ref(null);
const locationError = ref('');
const client = computed(() => ds.clientById(auth.user?.clientId));

const departments = ref([]);
const provinces = ref([]);
const districts = ref([]);

const cityOptions = computed(() => departments.value);
const provinceOptions = computed(() => provinces.value.filter(item => !city.value || item.parentCode === city.value));
const districtOptions = computed(() => districts.value.filter(item => !province.value || item.parentCode === province.value));

onMounted(async () => {
  try {
    [departments.value, provinces.value, districts.value] = await Promise.all([
      referenceDataApi.get('departments'),
      referenceDataApi.get('provinces'),
      referenceDataApi.get('districts'),
    ]);
  } catch (error) {
    console.error('Reference data fetch failed', error);
  }
});

function referenceCode(rows, value) {
  const normalized = String(value || '').trim().toLowerCase();
  return rows.find(item => item.code === value || String(item.label).toLowerCase() === normalized)?.code || '';
}

function referenceLabel(rows, code) {
  return rows.find(item => item.code === code)?.label || code;
}

function splitStreetAddress(value = '') {
  const address = String(value).trim();
  const match = address.match(/^(av(?:enida)?\.?|jr\.?|jir[oó]n|calle)\s+/i);
  if (!match) return { type: 'Av.', line: address };
  const key = match[1].toLowerCase();
  const type = key.startsWith('jr') || key.startsWith('jir') ? 'Jr.' : key.startsWith('calle') ? 'Calle' : 'Av.';
  return { type, line: address.slice(match[0].length).trim() };
}

function selectCity() {
  if (!provinceOptions.value.some(item => item.code === province.value)) {
    province.value = '';
    district.value = '';
  }
}

function selectProvince() {
  if (!districtOptions.value.some(item => item.code === district.value)) district.value = '';
}

watch([client, provinces, departments, districts], () => {
  const value = client.value;
  if (!value || !provinces.value.length) return;
  if (!addressLine.value) {
    const parsedAddress = splitStreetAddress(value.address);
    addressType.value = parsedAddress.type;
    addressLine.value = parsedAddress.line;
  }
  if (!province.value) province.value = referenceCode(provinces.value, value.province);
  const provItem = provinces.value.find(item => item.code === province.value);
  if (!city.value) city.value = provItem?.parentCode || referenceCode(departments.value, value.city || value.province);
  if (!district.value) district.value = referenceCode(districts.value, value.district);
  if (!reference.value) reference.value = value.deliveryReference || '';
}, { deep: true, immediate: true });
const addresses = computed(() => {
  const saved = ds.D.deliveryAddresses.filter(address => ds.clientRecordMatches(address, auth.user?.clientId));
  if (!client.value?.address) return saved;
  const clientAddress = {
    id: `client-${client.value.id}`,
    label: t('buyerRequestBuilder.primaryAddress'),
    address: client.value.address,
    district: client.value.district,
    province: client.value.province,
    city: client.value.city || client.value.province,
    reference: client.value.deliveryReference || '',
    window: client.value.deliveryPreference || '',
  };
  return saved.some(address => address.address === clientAddress.address) ? saved : [clientAddress, ...saved];
});
const selectedAddressId = ref('');
const submitting = ref(false);
const submitError = ref('');
const selectedAddress = computed(() => addresses.value.find(address => address.id === selectedAddressId.value) || addresses.value[0] || null);
const primaryWarehouse = computed(() => {
  const warehouse = ds.D.warehouses.find(item =>
    String(item.name || '').includes('ICISA Lima Cold Hub') ||
    String(item.location || item.address || '').includes('Guillermo Dansey')
  ) || ds.D.warehouses[0] || {};
  const address = warehouse.location || warehouse.address || 'Av. Guillermo Dansey 2211, Cercado de Lima, Lima, Perú';
  return {
    name: warehouse.name || 'ICISA Lima Cold Hub',
    address,
    district: warehouse.district || 'Cercado de Lima',
    province: warehouse.province || 'Lima',
  };
});
const warehouseOriginText = computed(() => `${primaryWarehouse.value.name}, ${primaryWarehouse.value.address}`);
const manualAddressText = computed(() => [
  [addressType.value, addressLine.value].filter(Boolean).join(' '),
  referenceLabel(districts.value, district.value),
  referenceLabel(provinces.value, province.value),
  referenceLabel(departments.value, city.value)
].filter(Boolean).join(', '));
const savedAddressText = computed(() => selectedAddress.value?.address || manualAddressText.value);
const deliveryAddressText = computed(() => {
  if (deliveryMode.value === 'current' && currentLocation.value) {
    return t('buyerRequestBuilder.currentCoordinates', { lat: currentLocation.value.lat.toFixed(5), lng: currentLocation.value.lng.toFixed(5) });
  }
  if (deliveryMode.value === 'saved') return savedAddressText.value;
  return manualAddressText.value;
});
const deliveryAddressLine = computed(() => {
  if (deliveryMode.value === 'current' && currentLocation.value) return deliveryAddressText.value;
  if (deliveryMode.value === 'saved') return selectedAddress.value?.address || addressLine.value;
  return addressLine.value;
});
const mapDestinationQuery = computed(() => {
  if (deliveryMode.value === 'current' && currentLocation.value) {
    return `${currentLocation.value.lat},${currentLocation.value.lng}`;
  }
  return `${deliveryAddressText.value}, Peru`;
});
const encodedWarehouseOrigin = computed(() => encodeURIComponent(warehouseOriginText.value));
const encodedDeliveryAddress = computed(() => encodeURIComponent(mapDestinationQuery.value));
const mapReady = computed(() => Boolean(primaryWarehouse.value.name && primaryWarehouse.value.address && deliveryAddressText.value));
const mapEmbedUrl = computed(() => mapReady.value
  ? `https://maps.google.com/maps?f=d&source=s_d&saddr=${encodedWarehouseOrigin.value}&daddr=${encodedDeliveryAddress.value}&hl=${locale.value}&z=12&output=embed`
  : '');
const mapDirectionsUrl = computed(() => `https://www.google.com/maps/dir/?api=1&origin=${encodedWarehouseOrigin.value}&destination=${encodedDeliveryAddress.value}&travelmode=driving`);
const subtotal = computed(() => cart.total);
const paymentMethods = computed(() => ds.paymentMethodsForClient(auth.user?.clientId || ''));
const addressFieldsVisible = computed(() => deliveryMode.value === 'manual');
const deliverySummary = computed(() => {
  if (deliveryMode.value === 'current' && !currentLocation.value) return t('buyerRequestBuilder.enableLocation');
  return t('buyerRequestBuilder.routeSummary', { warehouse: primaryWarehouse.value.name, destination: deliveryAddressText.value });
});
const shippingCost = computed(() => subtotal.value > 0 ? Math.max(18, Math.min(85, subtotal.value * 0.035)) : 0);
const grandTotal = computed(() => subtotal.value + shippingCost.value);
const shippingEta = computed(() => t('buyerRequestBuilder.shippingEtaValue', { date: requestedDeliveryDate.value }));
const totalUnits = computed(() => cart.items.reduce((sum, item) => sum + Number(item.qty || 0), 0));
const canContinueProducts = computed(() => cart.items.length > 0);
const deliveryDateWarning = computed(() => {
  if (!requestedDeliveryDate.value) return t('buyerRequestBuilder.deliveryDateRequired');
  const selected = new Date(`${requestedDeliveryDate.value}T00:00:00`);
  const minimum = new Date(`${datePlusISO(3)}T00:00:00`);
  return selected < minimum ? t('buyerRequestBuilder.deliveryDateMinimum') : '';
});
const canSubmit = computed(() => {
  if (!auth.user?.clientId || !cart.items.length || !deliveryAddressText.value || deliveryDateWarning.value || submitting.value) return false;
  if (addressFieldsVisible.value) return Boolean(district.value && city.value && province.value && addressLine.value);
  return true;
});

const enrichedItems = computed(() => cart.items.map(item => {
  const product = ds.productById(item.productId) || {};
  return {
    ...item,
    catalogLinked: Boolean(item.catalogItemBackendId || item.backendId || product.backendId),
    coldType: item.coldType || product.coldType || 'chilled',
    brandName: item.brandName || product.brandName || product.brand || '',
    metadata: [item.sku || item.productId, item.brandName || product.brandName || product.brand, item.coldType || product.coldType].filter(Boolean).join(' · '),
    stock: product.stock,
  };
}));

function datePlusISO(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function submitRequest() {
  if (!canSubmit.value) return;
  submitting.value = true;
  submitError.value = '';
  try {
    const request = await ds.addPurchaseRequest({
      clientId: auth.user.clientId,
      buyerUserId: auth.user.id,
      deliveryAddressId: selectedAddress.value?.id || 'manual-address',
      requestedDeliveryDate: requestedDeliveryDate.value,
      deliveryDetails: {
        address: deliveryMode.value === 'manual'
          ? [addressType.value, addressLine.value].filter(Boolean).join(' ')
          : deliveryAddressLine.value,
        district: referenceLabel(districts.value, district.value),
        city: referenceLabel(departments.value, city.value),
        province: referenceLabel(provinces.value, province.value),
        reference: reference.value || '',
      },
      paymentOption: paymentMode.value,
      shippingEstimate: shippingCost.value,
      comments: [
        comments.value.trim(),
        t('buyerRequestBuilder.shippingEta') + ': ' + shippingEta.value,
        `Origin: ${primaryWarehouse.value.address}`,
      ].filter(Boolean).join('\n'),
      items: cart.items,
    });
    cart.clearDraft();
    router.push('/portal/purchase-requests/' + request.id);
  } catch (error) {
    submitError.value = error?.message || t('buyerRequestBuilder.submitError');
  } finally {
    submitting.value = false;
  }
}

function selectSavedAddress(addressId = '') {
  deliveryMode.value = 'saved';
  selectedAddressId.value = addressId || selectedAddress.value?.id || '';
  const address = selectedAddress.value;
  if (!address) return;
  addressLine.value = address.address || client.value?.address || addressLine.value;
  district.value = referenceCode(districts.value, address.district || client.value?.district || district.value);
  province.value = referenceCode(provinces.value, address.province || client.value?.province || province.value);
  const provItem = provinces.value.find(item => item.code === province.value);
  city.value = provItem?.parentCode || referenceCode(departments.value, address.city || client.value?.city || client.value?.province || city.value);
  reference.value = address.reference || address.window || client.value?.deliveryReference || reference.value;
}

function useManualAddress() {
  deliveryMode.value = 'manual';
  locationError.value = '';
}

function useCurrentLocation() {
  deliveryMode.value = 'current';
  locationError.value = '';
  if (!navigator.geolocation) {
    locationError.value = t('buyerRequestBuilder.geolocationUnavailable');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    position => {
      currentLocation.value = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      addressLine.value = t('buyerRequestBuilder.currentCoordinates', { lat: position.coords.latitude.toFixed(5), lng: position.coords.longitude.toFixed(5) });
      district.value = client.value?.district || district.value || 'Lima';
      province.value = client.value?.province || province.value || 'Lima';
      city.value = client.value?.city || city.value || 'Lima Metropolitana';
    },
    () => {
      locationError.value = t('buyerRequestBuilder.geolocationFailed');
    },
    { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 }
  );
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">{{ t('buyerRequestBuilder.title') }}</div>
        <div class="page-subtitle">{{ t('buyerRequestBuilder.subtitle') }}</div>
      </div>
    </div>

    <div v-if="!auth.user?.clientId" class="empty-state">
      <div class="empty-state-icon"><i class="pi pi-ban"></i></div>
      <div class="empty-state-title">{{ t('buyerRequestBuilder.noClient') }}</div>
    </div>

    <div v-else class="buyer-builder-flow">
      <div class="stepper buyer-stepper">
        <template v-for="(label, idx) in steps" :key="label">
          <div class="step-item" :class="step === idx + 1 ? 'step-active' : step > idx + 1 ? 'step-done' : 'step-pending'">
            <div class="step-circle"><i v-if="step > idx + 1" class="pi pi-check"></i><span v-else>{{ idx + 1 }}</span></div>
            <div class="step-label">{{ label }}</div>
          </div>
          <div v-if="idx < steps.length - 1" class="step-connector" :class="step > idx + 1 ? 'step-connector-done' : 'step-connector-pending'"></div>
        </template>
      </div>

      <section v-if="step === 1" class="flow-panel buyer-validation-panel">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">{{ t('buyerRequestBuilder.buyerTitle') }}</div>
            <div class="flow-subtitle">{{ t('buyerRequestBuilder.buyerSubtitle') }}</div>
          </div>
        </div>
        <div class="flow-panel-pad buyer-validation-grid">
          <div class="review-check ok">
            <i class="pi pi-user"></i>
            <span><strong>{{ auth.user?.name }}</strong><small>{{ auth.user?.email }}</small></span>
          </div>
          <div class="review-check ok">
            <i class="pi pi-building"></i>
            <span><strong>{{ client?.commercialName || client?.businessName || auth.user.clientId }}</strong><small>{{ auth.user.clientId }}</small></span>
          </div>
          <div class="review-check ok">
            <i class="pi pi-map-marker"></i>
            <span><strong>{{ primaryWarehouse.name }}</strong><small>{{ primaryWarehouse.address }}</small></span>
          </div>
          <button class="btn btn-primary span-full" type="button" @click="step = 2">
            {{ t('buyerRequestBuilder.continueProducts') }} <i class="pi pi-arrow-right"></i>
          </button>
        </div>
      </section>

      <div v-if="step === 2" class="request-builder-grid">
      <section class="flow-panel request-items-panel">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">{{ t('buyerRequestBuilder.itemsTitle') }}</div>
            <div class="flow-subtitle">{{ t('buyerRequestBuilder.itemsSubtitle', { count: cart.count }) }}</div>
          </div>
          <button class="btn btn-secondary btn-sm" @click="router.push('/portal/product-catalog')"><i class="pi pi-plus"></i> {{ t('buyerRequestBuilder.addProducts') }}</button>
        </div>
        <div class="flow-panel-pad request-item-list">
          <div v-for="item in enrichedItems" :key="item.productId" class="request-item-card">
            <div class="request-item-mark"><i class="pi pi-box"></i></div>
            <div class="request-item-copy">
              <strong>{{ item.name }}</strong>
              <span>{{ item.metadata }}</span>
              <small :class="item.catalogLinked ? 'ok-text' : 'danger-text'">
                {{ item.catalogLinked ? t('buyerRequestBuilder.catalogLinked') : t('buyerRequestBuilder.catalogMissing') }}
              </small>
            </div>
            <div class="request-item-controls">
              <button class="btn btn-ghost btn-sm" @click="cart.setQty(item.productId, item.qty - 1)">-</button>
              <input class="qty-input" type="number" min="1" :value="item.qty" @input="cart.setQty(item.productId, Number($event.target.value || 1))" />
              <button class="btn btn-ghost btn-sm" @click="cart.setQty(item.productId, item.qty + 1)">+</button>
              <strong>S/ {{ (Number(item.price || 0) * Number(item.qty || 1)).toFixed(2) }}</strong>
              <button class="btn btn-ghost btn-sm" @click="cart.remove(item.productId)"><i class="pi pi-trash"></i></button>
            </div>
          </div>
          <div v-if="!cart.items.length" class="empty-state compact">
            <div class="empty-state-title">{{ t('buyerRequestBuilder.emptyTitle') }}</div>
            <div class="empty-state-desc">{{ t('buyerRequestBuilder.emptyDescription') }}</div>
          </div>
          <div class="request-step-actions">
            <button class="btn btn-ghost" type="button" @click="step = 1"><i class="pi pi-arrow-left"></i> {{ t('common.back') }}</button>
            <button class="btn btn-primary" type="button" :disabled="!canContinueProducts" @click="step = 3">
              {{ t('buyerRequestBuilder.continueDelivery') }} <i class="pi pi-arrow-right"></i>
            </button>
          </div>
        </div>
      </section>
      </div>

      <div v-if="step === 3" class="delivery-grid">
        <section class="flow-panel delivery-form-card" style="margin-bottom:0">
          <div class="flow-panel-head">
            <div>
              <div class="flow-title">{{ t('buyerRequestBuilder.deliveryTitle') }}</div>
              <div class="flow-subtitle">{{ client?.commercialName || client?.businessName || auth.user.clientId }}</div>
            </div>
          </div>
          <div class="flow-panel-pad form-grid">
            <div class="span-full nexa-select-grid delivery-mode-grid">
              <button class="nexa-select-card" :class="{ active: deliveryMode === 'manual' }" type="button" @click="useManualAddress">
                <i class="pi pi-pencil"></i>
                <span><strong>{{ t('buyerRequestBuilder.manualAddress') }}</strong><small>{{ t('buyerRequestBuilder.manualAddressDescription') }}</small></span>
              </button>
              <button class="nexa-select-card" :class="{ active: deliveryMode === 'saved' }" type="button" @click="selectSavedAddress()">
                <i class="pi pi-bookmark"></i>
                <span><strong>{{ t('buyerRequestBuilder.savedAddress') }}</strong><small>{{ selectedAddress?.label || t('buyerRequestBuilder.savedAddressDescription') }}</small></span>
              </button>
              <button class="nexa-select-card" :class="{ active: deliveryMode === 'current' }" type="button" @click="useCurrentLocation">
                <i class="pi pi-map-marker"></i>
                <span><strong>{{ t('buyerRequestBuilder.currentLocation') }}</strong><small>{{ t('buyerRequestBuilder.currentLocationDescription', { warehouse: primaryWarehouse.name || t('common.notConfigured') }) }}</small></span>
              </button>
            </div>
            <label v-if="addresses.length && deliveryMode === 'saved'" class="field span-full">
              <span class="field-label">{{ t('buyerRequestBuilder.savedAddress') }}</span>
              <select v-model="selectedAddressId" class="plain-input" @change="selectSavedAddress(selectedAddressId)">
                <option v-for="address in addresses" :key="address.id" :value="address.id">{{ address.label }} - {{ address.window }}</option>
              </select>
            </label>
            <label v-if="addressFieldsVisible" class="field">
              <span class="field-label">{{ t('buyerRequestBuilder.city') || 'City' }}</span>
              <select v-model="city" class="plain-input" @change="selectCity">
                <option value="">Select city</option>
                <option v-for="item in cityOptions" :key="item.code" :value="item.code">{{ item.label }}</option>
              </select>
            </label>
            <label v-if="addressFieldsVisible" class="field">
              <span class="field-label">{{ t('buyerRequestBuilder.province') || 'Province' }}</span>
              <select v-model="province" class="plain-input" :disabled="!city" @change="selectProvince">
                <option value="">Select province</option>
                <option v-for="item in provinceOptions" :key="item.code" :value="item.code">{{ item.label }}</option>
              </select>
            </label>
            <label v-if="addressFieldsVisible" class="field">
              <span class="field-label">{{ t('buyerRequestBuilder.district') || 'District' }}</span>
              <select v-model="district" class="plain-input" :disabled="!province">
                <option value="">Select district</option>
                <option v-for="item in districtOptions" :key="item.code" :value="item.code">{{ item.label }}</option>
              </select>
            </label>
            <div v-if="addressFieldsVisible" class="field span-full">
              <span class="field-label">{{ t('buyerRequestBuilder.addressLine') }}</span>
              <div class="buyer-address-line">
                <select v-model="addressType" class="plain-input">
                  <option value="Av.">Av.</option>
                  <option value="Calle">Calle</option>
                  <option value="Jr.">Jr.</option>
                  <option value="Pasaje">Pasaje</option>
                </select>
                <input v-model="addressLine" class="plain-input" :placeholder="t('buyerRequestBuilder.addressPlaceholder')" />
              </div>
            </div>
            <label class="field span-full">
              <span class="field-label">{{ t('buyerRequestBuilder.reference') }}</span>
              <input v-model="reference" class="plain-input" :placeholder="t('buyerRequestBuilder.referencePlaceholder')" />
            </label>
            <label class="field span-full">
              <span class="field-label">{{ t('buyerRequestBuilder.requestedDate') }}</span>
              <input v-model="requestedDeliveryDate" type="date" class="plain-input" :min="datePlusISO(3)" />
              <small v-if="deliveryDateWarning" class="field-error">{{ deliveryDateWarning }}</small>
            </label>
            <label class="field span-full">
              <span class="field-label">{{ t('buyerRequestBuilder.salesMessage') }}</span>
              <textarea v-model="comments" rows="4" class="plain-input" :placeholder="t('portal.requestNotesPlaceholder')"></textarea>
            </label>
            <div class="span-full nexa-select-grid">
              <button class="nexa-select-card" :class="{ active: paymentMode === 'credit_line' }" type="button" @click="paymentMode = 'credit_line'">
                <i class="pi pi-wallet"></i>
                <span><strong>{{ t('buyerRequestBuilder.useCredit') }}</strong><small>{{ paymentMethods[0]?.label || t('buyerRequestBuilder.creditLine') }} · {{ t('buyerRequestBuilder.salesValidation') }}</small></span>
              </button>
              <button class="nexa-select-card" :class="{ active: paymentMode === 'bank_transfer' }" type="button" @click="paymentMode = 'bank_transfer'">
                <i class="pi pi-credit-card"></i>
                <span><strong>{{ t('buyerRequestBuilder.bankTransfer') }}</strong><small>{{ t('buyerRequestBuilder.bankTransferDescription') }}</small></span>
              </button>
            </div>
            <div class="request-step-actions span-full">
              <button class="btn btn-ghost" type="button" @click="step = 2"><i class="pi pi-arrow-left"></i> {{ t('common.back') }}</button>
              <button class="btn btn-primary" type="button" :disabled="!canSubmit" @click="step = 4">
                {{ t('buyerRequestBuilder.continueConfirm') }} <i class="pi pi-arrow-right"></i>
              </button>
            </div>
            <p v-if="submitError" class="muted-text span-full">{{ submitError }}</p>
          </div>
        </section>

        <aside class="flow-panel route-map-card" style="margin-bottom:0">
          <div class="flow-panel-head">
            <div>
              <div class="flow-title">{{ t('buyerRequestBuilder.routePreview') || 'Route preview' }}</div>
              <p style="font-size:12px;color:#64748b;margin-top:4px">{{ t('buyerRequestBuilder.routePreviewDescription') || 'Map centers on the selected delivery destination. Open map shows driving route.' }}</p>
            </div>
            <a v-if="mapReady" class="btn btn-secondary btn-sm" :href="mapDirectionsUrl" target="_blank" rel="noopener noreferrer">
              <i class="pi pi-external-link"></i> {{ t('buyerRequestBuilder.openMaps') }}
            </a>
          </div>
          <div class="flow-panel-pad flow-stack" style="gap:14px">
            <div class="span-full route-trace-card" style="margin:0">
              <div>
                <span>{{ t('buyerRequestBuilder.traceableRoute') }}</span>
                <strong>{{ deliverySummary }}</strong>
              </div>
              <small v-if="locationError" class="danger-text">{{ locationError }}</small>
            </div>
            
            <iframe v-if="mapReady" :title="t('buyerRequestBuilder.routePreview')" :src="mapEmbedUrl" loading="lazy" referrerpolicy="no-referrer-when-downgrade" style="width:100%;height:300px;border:1px solid #e2e8f0;border-radius:12px;margin:0"></iframe>
            <div v-else class="empty-state compact">{{ t('buyerRequestBuilder.completeAddressToPreview') || 'Complete delivery details to preview the route.' }}</div>
            
            <div class="span-full request-cost-card" style="margin:0">
              <div><span>{{ t('buyerRequestBuilder.products') }}</span><strong>S/ {{ subtotal.toFixed(2) }}</strong></div>
              <div><span>{{ t('buyerRequestBuilder.shippingCost') }}</span><strong>S/ {{ shippingCost.toFixed(2) }}</strong></div>
              <div><span>{{ t('buyerRequestBuilder.shippingEta') }}</span><strong>{{ shippingEta }}</strong></div>
              <div><span>{{ t('buyerRequestBuilder.total') }}</span><strong>S/ {{ grandTotal.toFixed(2) }}</strong></div>
            </div>
            <div class="banner banner-info span-full" style="margin:0">
              <i class="pi pi-map-marker"></i>
              <div>{{ t('buyerRequestBuilder.traceabilityNotice') }}</div>
            </div>
          </div>
        </aside>
      </div>

      <section v-if="step === 4" class="flow-panel buyer-confirm-panel">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">{{ t('buyerRequestBuilder.confirmTitle') }}</div>
            <div class="flow-subtitle">{{ client?.commercialName || client?.businessName || auth.user.clientId }} · {{ deliveryAddressText }}</div>
          </div>
          <span class="flow-pill flow-pill-blue">{{ totalUnits }} {{ t('buyerRequestBuilder.units') }}</span>
        </div>
        <div class="flow-panel-pad buyer-confirm-grid">
          <div class="request-item-list">
            <div v-for="item in enrichedItems" :key="item.productId" class="request-item-card">
              <div class="request-item-mark"><i class="pi pi-box"></i></div>
              <div class="request-item-copy">
                <strong>{{ item.name }}</strong>
                <span>{{ item.metadata }}</span>
              </div>
              <div class="request-item-controls">
                <button class="btn btn-ghost btn-sm" @click="cart.setQty(item.productId, item.qty - 1)">-</button>
                <input class="qty-input" type="number" min="1" :value="item.qty" @input="cart.setQty(item.productId, Number($event.target.value || 1))" />
                <button class="btn btn-ghost btn-sm" @click="cart.setQty(item.productId, item.qty + 1)">+</button>
                <strong>S/ {{ (Number(item.price || 0) * Number(item.qty || 1)).toFixed(2) }}</strong>
              </div>
            </div>
          </div>
          <aside class="flow-stack">
            <div class="review-check ok"><i class="pi pi-map-marker"></i><span><strong>{{ t('buyerRequestBuilder.deliveryTitle') }}</strong><small>{{ deliveryAddressText }}</small></span></div>
            <div class="review-check ok"><i class="pi pi-calendar"></i><span><strong>{{ t('buyerRequestBuilder.requestedDate') }}</strong><small>{{ requestedDeliveryDate }}</small></span></div>
            <div class="review-check ok"><i class="pi pi-credit-card"></i><span><strong>{{ paymentMode === 'credit_line' ? t('buyerRequestBuilder.useCredit') : t('buyerRequestBuilder.bankTransfer') }}</strong><small>{{ t('buyerRequestBuilder.salesValidation') }}</small></span></div>
            <div class="request-cost-card">
              <div><span>{{ t('buyerRequestBuilder.products') }}</span><strong>S/ {{ subtotal.toFixed(2) }}</strong></div>
              <div><span>{{ t('buyerRequestBuilder.shippingCost') }}</span><strong>S/ {{ shippingCost.toFixed(2) }}</strong></div>
              <div><span>{{ t('buyerRequestBuilder.shippingEta') }}</span><strong>{{ shippingEta }}</strong></div>
              <div><span>{{ t('buyerRequestBuilder.total') }}</span><strong>S/ {{ grandTotal.toFixed(2) }}</strong></div>
            </div>
            <div class="banner banner-info" style="margin:0">
              <i class="pi pi-info-circle"></i>
              <div>{{ t('buyerRequestBuilder.traceabilityNotice') }}</div>
            </div>
            <div class="request-step-actions">
              <button class="btn btn-ghost" type="button" @click="step = 2"><i class="pi pi-arrow-left"></i> {{ t('buyerRequestBuilder.backToCart') }}</button>
              <button class="btn btn-primary" :disabled="!canSubmit" @click="submitRequest">
                <i class="pi pi-send"></i> {{ submitting ? t('buyerRequestBuilder.submitting') : t('buyerRequestBuilder.submit') }}
              </button>
            </div>
            <p v-if="submitError" class="muted-text">{{ submitError }}</p>
          </aside>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.buyer-builder-flow {
  display: grid;
  gap: 18px;
  width: min(100%, 1480px);
  margin: 0 auto;
}

.buyer-stepper {
  margin-bottom: 0;
}

.buyer-validation-panel,
.buyer-confirm-panel {
  width: 100%;
}

.buyer-validation-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.buyer-confirm-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(360px, .55fr);
  gap: 18px;
  align-items: start;
}

.request-builder-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.request-items-panel,
.request-side-panel {
  min-width: 0;
}

.delivery-mode-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.delivery-mode-grid .nexa-select-card {
  min-height: 118px;
  justify-content: flex-start;
}
.buyer-address-line {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 10px;
}

.request-item-list {
  display: grid;
  gap: 12px;
}

.request-item-card {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 14px;
  border: 1px solid #dbe3ef;
  border-radius: 14px;
  background: #ffffff;
}

.request-item-mark {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eff6ff;
  color: #2563eb;
  font-size: 21px;
}

.request-item-copy strong {
  display: block;
  color: #0f172a;
  font-size: 15px;
  line-height: 1.25;
}

.request-item-copy span,
.request-item-copy small {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.ok-text { color: #15803d !important; }
.danger-text { color: #b91c1c !important; }

.request-item-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.qty-input {
  width: 54px;
  height: 36px;
  border: 1px solid #d7deea;
  border-radius: 10px;
  text-align: center;
  font-weight: 800;
}

.request-cost-card {
  display: grid;
  gap: 10px;
  padding: 14px;
  border: 1px solid #bfdbfe;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #eff6ff 100%);
}

.request-cost-card div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.request-cost-card div:last-child {
  margin-top: 4px;
  padding: 10px 12px;
  border-top: 1px solid #dbe3ef;
  border-radius: 12px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 16px;
}

.route-trace-card {
  padding: 16px;
  border: 1px solid #bfdbfe;
  border-radius: 16px;
  background: #eff6ff;
  color: #1e40af;
}

.route-trace-card span,
.route-trace-card small {
  display: block;
  color: #64748b;
  font-size: 13px;
  line-height: 1.35;
}

.route-trace-card strong {
  display: block;
  margin-top: 4px;
  color: #0f172a;
  font-size: 15px;
  line-height: 1.35;
}

.request-step-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
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
  min-width: 0;
}

.review-check small {
  color: #64748b;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.delivery-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

@media (max-width: 1180px) {
  .request-builder-grid,
  .buyer-confirm-grid,
  .delivery-grid {
    grid-template-columns: 1fr;
  }

  .buyer-validation-grid {
    grid-template-columns: 1fr;
  }

  .delivery-mode-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .request-item-card {
    grid-template-columns: 44px minmax(0, 1fr);
  }
  .buyer-address-line {
    grid-template-columns: 1fr;
  }
  .request-item-controls {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
}
</style>
