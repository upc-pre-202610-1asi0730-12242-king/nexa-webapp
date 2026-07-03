<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useDataStore } from '@/app/application/stores/data.store';
import { useCartStore } from '@/app/application/stores/cart.store';
import { coldTypeBadge, coldTypeLabel } from '@/shared/status';
import { CATALOG_BRANDS, brandForProduct, logoForProduct } from '@/catalog-management/application/product-catalog/product-brand';

const { t, te } = useI18n();
const toast = useToast();
const router = useRouter();
const ds = useDataStore();
const cart = useCartStore();
const D = ds.D;

const search = ref('');
const category = ref('all');
const stockFilter = ref('all');
const coldType = ref('all');
const brand = ref('all');
const onlyOffers = ref(false);
const brandExpanded = ref(false);
const detail = ref(null);

const categories = computed(() => ['all', ...new Set(D.products.map(product => product.category).filter(Boolean))]);
const coldTypes = computed(() => ['all', ...new Set(D.products.map(product => product.coldType).filter(Boolean))]);
const brands = computed(() => ['all', ...CATALOG_BRANDS, ...new Set(D.products.map(product => brandForProduct(product)).filter(item => item && item !== 'Brand pending' && !CATALOG_BRANDS.includes(item)))]);
const stockOptions = ['all', 'ok', 'low', 'out'];

const filtered = computed(() => {
  let rows = D.products;
  if (category.value !== 'all') rows = rows.filter(product => product.category === category.value);
  if (stockFilter.value !== 'all') rows = rows.filter(product => product.status === stockFilter.value);
  if (coldType.value !== 'all') rows = rows.filter(product => product.coldType === coldType.value);
  if (brand.value !== 'all') rows = rows.filter(product => brandForProduct(product) === brand.value);
  if (onlyOffers.value) rows = rows.filter(product => ds.promotionsForProduct(product.id).length);
  if (search.value) {
    const q = search.value.toLowerCase();
    rows = rows.filter(product =>
      product.name.toLowerCase().includes(q) ||
      product.sku.toLowerCase().includes(q) ||
      product.category.toLowerCase().includes(q) ||
      brandForProduct(product).toLowerCase().includes(q)
    );
  }
  return rows;
});

const filteredSummary = computed(() => t('catalog.filteredSummary', { visible: filtered.value.length, total: D.products.length }));
const cartProductIds = computed(() => new Set(cart.items.map(item => item.productId)));

function statusLabel(status) {
  return status === 'ok' ? t('catalog.available') : status === 'low' ? t('catalog.lowStock') : t('catalog.outOfStock');
}

function statusBadge(status) {
  return 'badge-' + ({ ok: 'green', low: 'amber', out: 'red' }[status] || 'gray');
}

function categoryLabel(value) {
  const key = String(value || '').toLowerCase();
  const labelKey = `catalog.category.${key}`;
  return key && te(labelKey) ? t(labelKey) : value;
}

function hasActiveDemand(product) {
  return D.orderItems.some(item => item.productId === product.id) ||
    D.requestItems.some(item => item.productId === product.id);
}

function editGuardLabel(product) {
  if (hasActiveDemand(product)) return t('catalog.activeDemandGuard');
  if (product.status === 'out') return t('catalog.outStockGuard');
  return t('catalog.readyMaintenance');
}

function openDetail(product) {
  detail.value = product;
}

function addToManualOrder(product) {
  if (cartProductIds.value.has(product.id)) {
    cart.remove(product.id);
    detail.value = null;
    return;
  }
  if (!cart.add(product)) {
    toast.add({ severity: 'warn', summary: t('catalog.outOfStock'), detail: t('catalog.outOfStockMessage'), life: 3500 });
    return;
  }
  detail.value = null;
}

function goToOrderCart() {
  router.push('/ops/commercial/manual-order-entry');
}
</script>

<template>
  <div class="page-header catalog-page-header">
    <div>
      <div class="page-title">{{ t('nav.catalog') }}</div>
      <div class="page-subtitle">{{ D.products.length }} {{ t('catalog.subtitle') }}</div>
    </div>
    <button class="btn btn-primary" @click="goToOrderCart">
      <i class="pi pi-shopping-cart" aria-hidden="true"></i>
      {{ cart.count ? t('catalog.goToOrderCart', { count: cart.count }) : t('nav.createOrder') }}
    </button>
  </div>

  <div class="catalog-layout catalog-management-layout">
    <aside class="catalog-filter-panel" :aria-label="t('catalog.filters')">
      <div class="search-input catalog-search">
        <i class="pi pi-search" aria-hidden="true"></i>
        <input v-model="search" :placeholder="t('catalog.searchFullPlaceholder')" :aria-label="t('catalog.searchFullPlaceholder')" />
      </div>

      <section class="catalog-filter-section">
        <div class="catalog-filter-title">{{ t('catalog.categories') }}</div>
        <button v-for="item in categories" :key="item" class="catalog-filter-option" :class="{ active: category === item }" @click="category = item">
          {{ item === 'all' ? t('catalog.allCategories') : categoryLabel(item) }}
        </button>
      </section>

      <section class="catalog-filter-section">
        <div class="catalog-filter-title">{{ t('catalog.status') }}</div>
        <button v-for="item in stockOptions" :key="item" class="catalog-filter-option" :class="{ active: stockFilter === item }" @click="stockFilter = item">
          {{ item === 'all' ? t('catalog.allStock') : statusLabel(item) }}
        </button>
      </section>

      <section class="catalog-filter-section">
        <div class="catalog-filter-title">{{ t('catalog.coldType') }}</div>
        <button v-for="item in coldTypes" :key="item" class="catalog-filter-option" :class="{ active: coldType === item }" @click="coldType = item">
          {{ item === 'all' ? t('catalog.allColdTypes') : coldTypeLabel(item) }}
        </button>
      </section>

      <section class="catalog-filter-section">
        <button class="catalog-filter-heading" type="button" @click="brandExpanded = !brandExpanded" :aria-expanded="brandExpanded">
          <span>{{ t('catalog.brand') }}</span>
          <i :class="['pi', brandExpanded ? 'pi-chevron-up' : 'pi-chevron-down']"></i>
        </button>
        <button class="catalog-filter-option" :class="{ active: brand === 'all' }" @click="brand = 'all'">{{ t('catalog.allBrands') }}</button>
        <div v-if="brandExpanded" class="catalog-filter-collapsible">
          <button v-for="item in brands.filter(item => item !== 'all')" :key="item" class="catalog-filter-option" :class="{ active: brand === item }" @click="brand = item">
            {{ item }}
          </button>
        </div>
      </section>

      <section class="catalog-filter-section">
        <button class="catalog-filter-option" :class="{ active: onlyOffers }" @click="onlyOffers = !onlyOffers">
          <i class="pi pi-tag"></i> {{ t('catalog.offers') }}
        </button>
      </section>
    </aside>

    <section class="catalog-results">
      <div class="catalog-results-head">
        <strong>{{ filteredSummary }}</strong>
        <span>{{ t('catalog.filters') }}</span>
      </div>

      <div class="grid-4 catalog-product-grid">
        <article v-for="product in filtered" :key="product.id" class="buyer-card catalog-management-card" :class="{ selected: cartProductIds.has(product.id) }" @click="openDetail(product)">
          <div class="buyer-product-visual" :class="'cat-' + product.cat">
            <img v-if="logoForProduct(product)" class="catalog-brand-logo" :src="logoForProduct(product)" :alt="brandForProduct(product)" loading="lazy" />
            <img v-if="product.imageUrl" class="buyer-product-image" :src="product.imageUrl" :alt="product.name" loading="lazy" />
            <i v-else class="pi pi-box"></i>
            <span v-if="ds.promotionsForProduct(product.id).length" class="flow-pill flow-pill-amber catalog-card-offer">
              {{ t('catalog.offer') }}
            </span>
            <span v-if="cartProductIds.has(product.id)" class="flow-pill flow-pill-blue catalog-card-selected">
              {{ t('catalog.selected') }}
            </span>
          </div>
          <div class="catalog-card-body">
            <div class="flow-row-between catalog-card-title-row">
              <div>
                <div class="catalog-card-title">{{ product.name }}</div>
                <div class="mono catalog-card-sku">{{ product.sku }}</div>
                <div class="catalog-brand-line">{{ t('catalog.brandLine', { brand: brandForProduct(product) }) }}</div>
                <div v-if="product.presentation" class="catalog-presentation">{{ product.presentation }}</div>
              </div>
            <button
              :class="'add-btn ' + (cartProductIds.has(product.id) ? 'add-btn-added' : 'add-btn-default')"
              type="button"
              :disabled="product.status === 'out'"
              :title="product.status === 'out' ? t('catalog.outOfStockMessage') : cartProductIds.has(product.id) ? t('catalog.remove') : t('catalog.manualEntry')"
              @click.stop="addToManualOrder(product)"
              :aria-label="cartProductIds.has(product.id) ? t('catalog.remove') : t('catalog.manualEntry')"
            >
                <i :class="['pi', cartProductIds.has(product.id) ? 'pi-trash' : 'pi-plus']"></i>
              </button>
            </div>
            <div class="flow-row catalog-card-badges">
              <span :class="coldTypeBadge(product.coldType)">{{ coldTypeLabel(product.coldType) }}</span>
              <span class="badge-temp">{{ product.temperatureRange || product.temp }}</span>
              <span :class="'badge ' + statusBadge(product.status)">{{ statusLabel(product.status) }}</span>
            </div>
            <div class="flow-row-between catalog-card-footer">
              <strong>S/ {{ product.price.toFixed(2) }}</strong>
              <span>{{ product.stock - product.reserved }} {{ product.unit }} {{ t('catalog.dispUnit') }}</span>
            </div>
            <small v-if="product.status === 'out'" class="catalog-stock-message" role="status">{{ t('catalog.outOfStockMessage') }}</small>
          </div>
        </article>
      </div>
    </section>
  </div>

  <transition name="fade">
    <div v-if="detail" class="catalog-detail-backdrop" role="dialog" aria-modal="true" @click.self="detail = null">
      <section class="catalog-detail-modal">
        <button class="catalog-detail-close" type="button" :aria-label="t('common.close')" @click="detail = null">
          <i class="pi pi-times"></i>
        </button>
        <div class="catalog-detail-hero">
          <div class="buyer-product-visual" :class="'cat-' + detail.cat">
            <img v-if="logoForProduct(detail)" class="catalog-brand-logo catalog-brand-logo-large" :src="logoForProduct(detail)" :alt="brandForProduct(detail)" />
            <img v-if="detail.imageUrl" class="buyer-product-image buyer-product-image-large" :src="detail.imageUrl" :alt="detail.name" />
            <i v-else class="pi pi-box"></i>
          </div>
        </div>
        <div class="catalog-detail-content">
          <div>
            <div class="mono catalog-detail-code">{{ detail.sku }}</div>
            <h2>{{ detail.name }}</h2>
            <p>{{ t('catalog.brandLine', { brand: brandForProduct(detail) }) }}</p>
          </div>
          <div class="catalog-detail-grid">
            <div><span>{{ t('catalog.temperature') }}</span><strong>{{ detail.temperatureRange || detail.temp }}</strong></div>
            <div><span>{{ t('catalog.unit') }}</span><strong>{{ detail.unit }}</strong></div>
            <div><span>{{ t('catalog.presentation') }}</span><strong>{{ detail.presentation || '-' }}</strong></div>
            <div><span>{{ t('catalog.availableStock') }}</span><strong>{{ detail.stock - detail.reserved }} {{ detail.unit }}</strong></div>
            <div><span>{{ t('catalog.price') }}</span><strong>S/ {{ detail.price.toFixed(2) }}</strong></div>
            <div><span>{{ t('catalog.warehouse') }}</span><strong>{{ detail.warehouse }} / {{ detail.zone }}</strong></div>
            <div><span>{{ t('catalog.status') }}</span><strong>{{ statusLabel(detail.status) }}</strong></div>
            <div><span>{{ t('catalog.coldType') }}</span><strong>{{ coldTypeLabel(detail.coldType) }}</strong></div>
            <div><span>{{ t('catalog.brand') }}</span><strong>{{ brandForProduct(detail) }}</strong></div>
          </div>
          <div class="catalog-detail-actions">
            <span :class="'badge ' + (hasActiveDemand(detail) ? 'badge-amber' : 'badge-green')">{{ editGuardLabel(detail) }}</span>
            <button class="btn btn-ghost" type="button" @click="detail = null">{{ t('common.close') }}</button>
            <button class="btn btn-secondary" type="button" :disabled="hasActiveDemand(detail)">
              <i class="pi pi-pencil"></i> {{ t('common.edit') }}
            </button>
            <button class="btn btn-danger" type="button" :disabled="hasActiveDemand(detail) || detail.status !== 'out'">
              <i class="pi pi-trash"></i> {{ t('catalog.remove') }}
            </button>
            <button class="btn btn-primary" type="button" :disabled="detail.status === 'out'" :title="detail.status === 'out' ? t('catalog.outOfStockMessage') : ''" @click="addToManualOrder(detail)">
              <i class="pi pi-plus"></i> {{ t('catalog.useSelectedProduct') }}
            </button>
          </div>
        </div>
      </section>
    </div>
  </transition>
</template>

<style scoped>
.catalog-stock-message {
  color: #b91c1c;
  font-weight: 800;
}
.catalog-page-header {
  margin-bottom: 18px;
}
.catalog-management-layout {
  grid-template-columns: minmax(250px, 300px) minmax(0, 1fr);
  align-items: stretch;
}
.catalog-results {
  min-width: 0;
}
.catalog-product-grid {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  align-items: stretch;
}
.catalog-results-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  color: #64748b;
  font-size: 12px;
}
.catalog-results-head strong {
  color: #0f172a;
}
.catalog-management-card {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  text-align: center;
  border: 1px solid #dbe5f2;
  box-shadow: none;
}
.catalog-management-card.selected {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, .14);
}
.catalog-management-card.selected:hover .add-btn-added {
  color: #dc2626 !important;
}
.catalog-card-offer {
  position: absolute;
  left: 12px;
  top: 12px;
}
.catalog-card-selected {
  position: absolute;
  left: 12px;
  bottom: 12px;
}
.catalog-card-body {
  padding: 16px;
  display: grid;
  gap: 12px;
  flex: 1;
}
.catalog-card-title-row {
  position: relative;
  align-items: flex-start;
  gap: 10px;
  justify-content: center;
  text-align: center;
  padding: 0 38px;
}
.catalog-card-title-row > div {
  min-width: 0;
}
.catalog-card-title-row .add-btn {
  position: absolute;
  top: 0;
  right: 0;
}
.catalog-card-title {
  color: #0f172a;
  font-size: 14px;
  font-weight: 850;
  line-height: 1.25;
}
.catalog-card-sku {
  margin-top: 5px;
  font-size: 10px;
}
.catalog-card-badges {
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 12px;
}
.catalog-card-footer {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #e8eef7;
  align-items: center;
  gap: 12px;
}
.catalog-card-footer strong {
  color: #0f172a;
  font-size: 16px;
}
.catalog-card-footer span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: #ecfdf5;
  color: #047857;
  font-size: 12px;
  font-weight: 900;
  box-shadow: inset 0 0 0 1px #a7f3d0;
}
.catalog-brand-line {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  padding: 5px 10px;
  border-radius: 999px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 900;
}
.catalog-presentation {
  margin-top: 8px;
  color: #475569;
  font-size: 12px;
  font-weight: 850;
}
.catalog-brand-logo {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
  max-width: 76px;
  max-height: 36px;
  object-fit: contain;
  padding: 4px;
  border-radius: 10px;
  background: rgba(255, 255, 255, .86);
  border: 1px solid rgba(226, 232, 240, .9);
}
.catalog-brand-logo-large {
  top: 18px;
  right: 18px;
  max-width: 112px;
  max-height: 52px;
}
.catalog-detail-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, .48);
}
.catalog-detail-modal {
  position: relative;
  display: grid;
  grid-template-columns: minmax(280px, .85fr) minmax(0, 1.15fr);
  width: min(980px, 100%);
  max-height: min(88vh, 820px);
  overflow: auto;
  border: 1px solid #dbe5f2;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 28px 72px rgba(15, 23, 42, .26);
}
.catalog-detail-close {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 1;
  width: 40px;
  height: 40px;
  border: 1px solid #dbe5f2;
  border-radius: 12px;
  background: #fff;
  color: #475569;
}
.catalog-detail-hero {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 420px;
  padding: 28px;
  background: linear-gradient(135deg, #eff6ff, #f8fafc);
}
.catalog-detail-hero .buyer-product-visual {
  position: relative;
  width: min(320px, 100%);
  height: 320px;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 16px 34px rgba(15, 23, 42, .08);
}
.catalog-detail-content {
  padding: 52px 28px 28px;
}
.catalog-detail-code {
  color: #2563eb;
  font-weight: 900;
}
.catalog-detail-content h2 {
  margin: 8px 0 6px;
  color: #0f172a;
  font-size: 26px;
  line-height: 1.12;
}
.catalog-detail-content p {
  margin: 0 0 18px;
  color: #64748b;
}
.catalog-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.catalog-detail-grid div {
  min-height: 72px;
  border: 1px solid #e8eef7;
  border-radius: 16px;
  background: #f8fafc;
  padding: 14px;
}
.catalog-detail-grid span {
  display: block;
  color: #64748b;
  font-size: 11px;
  font-weight: 850;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.catalog-detail-grid strong {
  color: #0f172a;
}
.catalog-detail-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
}
.catalog-detail-actions .badge {
  margin-right: auto;
}
@media (max-width: 1024px) {
  .catalog-detail-modal,
  .catalog-management-layout {
    grid-template-columns: 1fr;
  }
  .catalog-detail-hero {
    min-height: 300px;
  }
}
@media (max-width: 640px) {
  .catalog-detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
