<script setup>
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useDataStore } from '@/app/application/stores/data.store';
import { useCartStore } from '@/app/application/stores/cart.store';
import { useProductCatalogStore } from '@/catalog-management/application/product-catalog/product-catalog.store';
import { coldTypeLabel, coldTypeBadge } from '@/shared/status';
import { brandForProduct, logoForProduct } from '@/catalog-management/application/product-catalog/product-brand';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const toast = useToast();
const ds = useDataStore();
const cart = useCartStore();
const productCatalogStore = useProductCatalogStore();

const product = computed(() => ds.productById(route.params.id));
const promos = computed(() => product.value ? ds.promotionsForProduct(product.value.id) : []);
const productReadModelId = computed(() => product.value?.backendId || null);
const availability = computed(() => productCatalogStore.availabilityForProduct(productReadModelId.value));
const availableStock = computed(() => {
  if (availability.value?.availableStock !== null && availability.value?.availableStock !== undefined) {
    return Number(availability.value.availableStock || 0);
  }
  if (availability.value?.catalogAvailableStock !== null && availability.value?.catalogAvailableStock !== undefined) {
    return Number(availability.value.catalogAvailableStock || 0);
  }
  return product.value ? Math.max(0, Number(product.value.stock || 0) - Number(product.value.reserved || 0)) : 0;
});
const cartProductIds = computed(() => new Set(cart.items.map(item => item.productId)));
const related = computed(() => {
  if (!product.value) return [];
  const currentBrand = brandForProduct(product.value);
  return ds.D.products
    .filter(item =>
      item.id !== product.value.id &&
      item.isVisibleToBuyer !== false &&
      item.status !== 'out'
    )
    .map(item => ({
      item,
      score:
        (item.category === product.value.category ? 3 : 0) +
        (brandForProduct(item) === currentBrand ? 2 : 0) +
        (item.coldType === product.value.coldType ? 1 : 0),
    }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || String(a.item.name).localeCompare(String(b.item.name)))
    .slice(0, 4)
    .map(entry => entry.item);
});

function addToRequest(item, openBuilder = false) {
  if (!cart.add(item)) {
    toast.add({ severity: 'warn', summary: t('catalog.outOfStock'), detail: t('catalog.outOfStockMessage'), life: 3500 });
    return;
  }
  if (openBuilder) router.push('/portal/request-builder');
}

function stockLabel(item) {
  if (item.status === 'low') return t('catalog.lowStock');
  if (item.status === 'out') return t('catalog.outOfStock');
  return item.commercialAvailability || t('catalog.available');
}

watch(productReadModelId, (id) => {
  if (id) productCatalogStore.loadProductAvailability(id).catch(() => {});
}, { immediate: true });
</script>

<template>
  <div v-if="!product" class="empty-state">
    <div class="empty-state-icon"><i class="pi pi-search"></i></div>
    <div class="empty-state-title">{{ t('catalog.detail.notFound') }}</div>
    <button class="btn btn-primary" @click="router.push('/portal/product-catalog')">{{ t('catalog.detail.back') }}</button>
  </div>

  <template v-else>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">
      <button class="btn btn-ghost btn-sm" @click="router.push('/portal/product-catalog')"><i class="pi pi-arrow-left"></i> {{ t('portal.nav.catalog') }}</button>
      <div>
        <div class="page-title">{{ product.name }}</div>
        <div class="page-subtitle">{{ product.sku }} - {{ product.category }} - {{ t('catalog.detail.brand') }}: {{ brandForProduct(product) }}</div>
      </div>
    </div>

    <div class="flow-grid-12">
      <section class="buyer-card span-5">
        <div class="buyer-product-visual" :class="'cat-' + product.cat" style="height:300px">
          <img v-if="logoForProduct(product)" class="buyer-detail-brand-logo" :src="logoForProduct(product)" :alt="brandForProduct(product)" />
          <img v-if="product.imageUrl" class="buyer-product-image buyer-product-image-large" :src="product.imageUrl" :alt="product.name" />
          <i v-else class="pi pi-box" style="font-size:74px"></i>
          <span v-if="promos.length" class="flow-pill flow-pill-amber" style="position:absolute;left:16px;top:16px">{{ t('catalog.detail.activeOffer') }}</span>
        </div>
      </section>

      <section class="flow-panel span-7">
        <div class="flow-panel-pad buyer-product-detail-content">
          <div class="flow-row buyer-product-status-row">
            <span :class="coldTypeBadge(product.coldType)">{{ coldTypeLabel(product.coldType) }}</span>
            <span class="badge-temp">{{ product.temperatureRange || product.temp }}</span>
            <span class="flow-pill flow-pill-green">{{ stockLabel(product) }}</span>
            <span class="flow-pill">{{ brandForProduct(product) }}</span>
          </div>

          <div class="buyer-product-summary">
            <div>
              <span class="flow-eyebrow">{{ product.category }}</span>
              <div class="buyer-title">{{ product.name }}</div>
              <p>{{ product.description || t('catalog.detail.defaultDescription') }}</p>
            </div>
            <div class="buyer-product-price">
              <span>{{ t('catalog.detail.referencePrice') }}</span>
              <strong>S/ {{ product.price.toFixed(2) }}</strong>
              <small>{{ t('catalog.detail.perUnit', { unit: product.unit }) }}</small>
            </div>
          </div>

          <div class="buyer-product-spec-grid">
            <div><span>{{ t('catalog.presentation') }}</span><strong>{{ product.presentation || product.unit }}</strong></div>
            <div><span>{{ t('catalog.unit') }}</span><strong>{{ product.unit }}</strong></div>
            <div><span>{{ t('catalog.detail.approxWeight') }}</span><strong>{{ product.weightKg || 1 }} kg</strong></div>
            <div><span>{{ t('catalog.availableStock') }}</span><strong>{{ availableStock }} {{ product.unit }}</strong></div>
            <div><span>{{ t('catalog.temperature') }}</span><strong>{{ product.temperatureRange || product.temp }}</strong></div>
            <div><span>{{ t('catalog.detail.coldType') }}</span><strong>{{ coldTypeLabel(product.coldType) }}</strong></div>
            <div><span>{{ t('catalog.warehouse') }}</span><strong>{{ product.warehouse || 'ICISA Lima Cold Hub' }}</strong></div>
            <div><span>{{ t('catalog.detail.storageZone') }}</span><strong>{{ product.zone || product.category }}</strong></div>
            <div><span>{{ t('catalog.detail.brand') }}</span><strong>{{ brandForProduct(product) }}</strong></div>
            <div><span>SKU</span><strong class="mono">{{ product.sku }}</strong></div>
          </div>

          <div v-if="promos.length" class="banner banner-warning">
            <i class="pi pi-tag"></i>
            <div>
              <strong>{{ promos[0].name }}:</strong>
              {{ promos[0].discountLabel || promos[0].commercialRule }}.
              {{ promos[0].description || promos[0].notes }}
            </div>
          </div>

          <div class="buyer-handling-panel">
            <i class="pi pi-snowflake"></i>
            <div>
              <strong>{{ t('catalog.detail.handling') }}</strong>
              <span>{{ t('catalog.detail.handlingDescription', { temperature: product.temperatureRange || product.temp }) }}</span>
            </div>
          </div>

          <div v-if="product.knowledge" class="banner banner-info">
            <i class="pi pi-info-circle"></i>
            <div><strong>{{ t('catalog.detail.knowledge') }}:</strong> {{ product.knowledge }}</div>
          </div>

          <div class="buyer-product-actions">
            <button class="btn btn-secondary btn-lg" type="button" :disabled="product.status === 'out'" :title="product.status === 'out' ? t('catalog.outOfStockMessage') : ''" @click="addToRequest(product)">
              <i :class="cartProductIds.has(product.id) ? 'pi pi-check' : 'pi pi-plus'"></i>
              {{ cartProductIds.has(product.id) ? t('catalog.detail.addedToRequest') : t('catalog.detail.addKeepBrowsing') }}
            </button>
            <button class="btn btn-primary btn-lg" type="button" :disabled="product.status === 'out'" :title="product.status === 'out' ? t('catalog.outOfStockMessage') : ''" @click="addToRequest(product, true)">
              <i class="pi pi-shopping-cart"></i> {{ t('catalog.detail.addOpenRequest') }}
            </button>
          </div>
        </div>
      </section>

      <section class="flow-panel span-12" v-if="related.length">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">{{ t('catalog.detail.relatedProducts') }}</div>
            <div class="flow-subtitle">{{ t('catalog.detail.relatedDescription') }}</div>
          </div>
        </div>
        <div class="related-product-grid flow-panel-pad">
          <article v-for="item in related" :key="item.id" class="buyer-card related-product-card">
            <button class="buyer-product-visual related-product-visual" :class="'cat-' + item.cat" type="button" @click="router.push('/portal/product-catalog/' + item.id)">
              <img v-if="logoForProduct(item)" class="related-brand-logo" :src="logoForProduct(item)" :alt="brandForProduct(item)" loading="lazy" />
              <img v-if="item.imageUrl" class="buyer-product-image" :src="item.imageUrl" :alt="item.name" loading="lazy" />
              <i v-else class="pi pi-box"></i>
              <span v-if="cartProductIds.has(item.id)" class="flow-pill flow-pill-blue related-selected">{{ t('catalog.selected') }}</span>
            </button>
            <div class="flow-panel-pad related-product-body">
              <strong>{{ item.name }}</strong>
              <span>{{ brandForProduct(item) }}</span>
              <small>{{ item.category }} - {{ item.temperatureRange || item.temp }} - {{ item.presentation || item.unit }}</small>
              <div class="flow-row-between related-price-row">
                <strong>S/ {{ item.price.toFixed(2) }}</strong>
                <span>{{ stockLabel(item) }}</span>
              </div>
              <div class="related-actions">
                <button class="btn btn-ghost btn-sm" type="button" @click="router.push('/portal/product-catalog/' + item.id)">{{ t('catalog.viewDetails') }}</button>
                <button class="btn btn-secondary btn-sm" type="button" @click="addToRequest(item)">
                  <i :class="cartProductIds.has(item.id) ? 'pi pi-check' : 'pi pi-plus'"></i>
                  {{ cartProductIds.has(item.id) ? t('catalog.detail.added') : t('catalog.detail.add') }}
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </template>
</template>

<style scoped>
.buyer-product-detail-content {
  display: grid;
  gap: 16px;
}
.buyer-product-status-row {
  flex-wrap: wrap;
}
.buyer-product-summary {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}
.buyer-product-summary .buyer-title {
  margin-top: 4px;
  color: #0f172a;
}
.buyer-product-summary p {
  max-width: 620px;
  margin: 8px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.55;
}
.buyer-product-price {
  min-width: 150px;
  display: grid;
  gap: 3px;
  padding: 12px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  text-align: right;
}
.buyer-product-price span,
.buyer-product-price small {
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}
.buyer-product-price strong {
  color: #1d4ed8;
  font-size: 22px;
}
.buyer-product-spec-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.buyer-product-spec-grid > div {
  min-width: 0;
  display: grid;
  gap: 4px;
  padding: 11px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}
.buyer-product-spec-grid span {
  color: #64748b;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .04em;
  text-transform: uppercase;
}
.buyer-product-spec-grid strong {
  color: #0f172a;
  font-size: 12px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}
.buyer-handling-panel {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 14px;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  background: #f0f9ff;
}
.buyer-handling-panel > i {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 8px;
  background: #e0f2fe;
  color: #0369a1;
}
.buyer-handling-panel div {
  display: grid;
  gap: 4px;
}
.buyer-handling-panel strong {
  color: #0f172a;
  font-size: 13px;
}
.buyer-handling-panel span {
  color: #475569;
  font-size: 12px;
  line-height: 1.5;
}
.buyer-product-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.buyer-product-actions .btn {
  justify-content: center;
}
.buyer-detail-brand-logo,
.related-brand-logo {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 1;
  max-width: 92px;
  max-height: 42px;
  object-fit: contain;
  padding: 5px;
  border-radius: 10px;
  background: rgba(255, 255, 255, .9);
  border: 1px solid rgba(226, 232, 240, .9);
}
.related-product-card {
  overflow: hidden;
}
.related-product-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.related-product-visual {
  width: 100%;
  min-height: 170px;
  border: 0;
}
.related-selected {
  position: absolute;
  left: 12px;
  bottom: 12px;
}
.related-product-body {
  display: grid;
  gap: 6px;
}
.related-product-body > strong {
  color: #0f172a;
  font-size: 13px;
  line-height: 1.35;
}
.related-product-body > span {
  color: #2563eb;
  font-size: 11px;
  font-weight: 900;
}
.related-product-body > small {
  min-height: 34px;
  color: #64748b;
  font-size: 11px;
  line-height: 1.45;
}
.related-price-row {
  margin-top: 6px;
  padding-top: 10px;
  border-top: 1px solid #e2e8f0;
}
.related-price-row > strong {
  color: #0f172a;
}
.related-price-row > span {
  color: #047857;
  font-size: 10px;
  font-weight: 900;
}
.related-actions {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  margin-top: 6px;
}
@media (max-width: 1100px) {
  .related-product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 720px) {
  .buyer-product-summary {
    flex-direction: column;
  }
  .buyer-product-price {
    width: 100%;
    box-sizing: border-box;
    text-align: left;
  }
  .buyer-product-spec-grid,
  .buyer-product-actions,
  .related-product-grid {
    grid-template-columns: 1fr;
  }
}
</style>
