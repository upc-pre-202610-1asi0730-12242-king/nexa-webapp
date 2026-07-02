<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useDataStore } from '@/app/application/stores/data.store';
import { useCartStore } from '@/app/application/stores/cart.store';
import { coldTypeLabel, coldTypeBadge } from '@/shared/status';
import { CATALOG_BRANDS, brandForProduct, logoForProduct } from '@/catalog-management/application/product-catalog/product-brand';

const router = useRouter();
const { t } = useI18n();
const toast = useToast();
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

const categories = computed(() => ['all', ...new Set(D.products.filter(p => p.isVisibleToBuyer !== false).map(p => p.category).filter(Boolean))]);
const coldTypes = computed(() => ['all', ...new Set(D.products.filter(p => p.isVisibleToBuyer !== false).map(p => p.coldType).filter(Boolean))]);
const brands = computed(() => ['all', ...CATALOG_BRANDS, ...new Set(D.products.map(product => brandForProduct(product)).filter(item => item && item !== 'Brand pending' && !CATALOG_BRANDS.includes(item)))]);
const stockOptions = ['all', 'ok', 'low', 'out'];

const filtered = computed(() => {
  let rows = D.products.filter(product => product.isVisibleToBuyer !== false);
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

const filteredSummary = computed(() => t('catalog.filteredSummary', { visible: filtered.value.length, total: D.products.filter(product => product.isVisibleToBuyer !== false).length }));
const cartProductIds = computed(() => new Set(cart.items.map(item => item.productId)));
const isInCart = (id) => cart.items.some(item => item.productId === id);
const cartItemFor = (id) => cart.items.find(item => item.productId === id);

function handleVisualClick(product) {
  router.push('/portal/product-catalog/' + product.id);
}

function categoryLabel(value) {
  const key = `catalog.category.${String(value || '').trim().toLowerCase()}`;
  const translated = t(key);
  return translated === key ? value : translated;
}

function toggleCartProduct(product) {
  if (isInCart(product.id)) {
    cart.remove(product.id);
    return;
  }
  if (!cart.add(product)) showOutOfStock();
}

function showOutOfStock() {
  toast.add({ severity: 'warn', summary: t('catalog.outOfStock'), detail: t('catalog.outOfStockMessage'), life: 3500 });
}

function setCartQuantity(product, quantity) {
  if (!isInCart(product.id) && !cart.add(product)) {
    showOutOfStock();
    return;
  }
  const max = Math.max(1, Number(product.stock || 0) - Number(product.reserved || 0));
  cart.setQty(product.id, Math.min(max, Number(quantity || 1)));
}

function statusLabel(status) {
  return status === 'ok' ? t('catalog.available') : status === 'low' ? t('catalog.lowStock') : t('catalog.outOfStock');
}

function statusBadge(status) {
  return 'badge-' + ({ ok: 'green', low: 'amber', out: 'red' }[status] || 'gray');
}
</script>

<template>
  <div class="page-header catalog-page-header">
    <div>
      <div class="page-title">{{ t('portal.nav.catalog') }}</div>
      <div class="page-subtitle">{{ t('catalog.authorizedProducts', { count: filtered.length }) }}</div>
    </div>
    <button class="btn btn-primary" @click="router.push('/portal/request-builder')">
      <i class="pi pi-shopping-cart"></i> {{ t('catalog.requestBuilderCount', { count: cart.count }) }}
    </button>
  </div>

  <div class="catalog-layout catalog-management-layout buyer-catalog-layout">
    <aside class="catalog-filter-panel" :aria-label="t('catalog.filters')">
      <div class="search-input catalog-search">
        <i class="pi pi-search"></i>
        <input v-model="search" :placeholder="t('catalog.searchFullPlaceholder')" />
      </div>

      <section class="catalog-filter-section">
        <div class="catalog-filter-title">{{ t('catalog.categories') }}</div>
        <button v-for="item in categories" :key="item" class="catalog-filter-option" :class="{ active: category === item }" @click="category = item">
          {{ item === 'all' ? t('catalog.allCategories') : categoryLabel(item) }}
        </button>
      </section>

      <section class="catalog-filter-section">
        <div class="catalog-filter-title">{{ t('catalog.coldType') }}</div>
        <button v-for="item in coldTypes" :key="item" class="catalog-filter-option" :class="{ active: coldType === item }" @click="coldType = item">
          {{ item === 'all' ? t('catalog.allColdTypes') : coldTypeLabel(item) }}
        </button>
      </section>

      <section class="catalog-filter-section">
        <div class="catalog-filter-title">{{ t('catalog.status') }}</div>
        <button v-for="item in stockOptions" :key="item" class="catalog-filter-option" :class="{ active: stockFilter === item }" @click="stockFilter = item">
          {{ item === 'all' ? t('catalog.allStock') : statusLabel(item) }}
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
        <article
          v-for="product in filtered"
          :key="product.id"
          class="buyer-card catalog-management-card"
          :class="{ selected: cartProductIds.has(product.id) }"
        >
          <button class="buyer-product-visual catalog-visual-button" :class="'cat-' + product.cat" type="button" @click="handleVisualClick(product)">
            <img v-if="logoForProduct(product)" class="catalog-brand-logo" :src="logoForProduct(product)" :alt="brandForProduct(product)" loading="lazy" />
            <img v-if="product.imageUrl" class="buyer-product-image" :src="product.imageUrl" :alt="product.name" loading="lazy" />
            <i v-else class="pi pi-box"></i>
            <span v-if="ds.promotionsForProduct(product.id).length" class="flow-pill flow-pill-amber catalog-card-offer">
              {{ t('catalog.offer') }}
            </span>
            <span v-if="cartProductIds.has(product.id)" class="flow-pill flow-pill-blue catalog-card-selected">
              {{ t('catalog.selected') }}
            </span>
          </button>
          <div class="catalog-card-body">
            <div class="catalog-card-title-row">
              <div>
                <div class="catalog-card-title">{{ product.name }}</div>
                <div class="mono catalog-card-sku">{{ product.sku }}</div>
                <div class="catalog-brand-line">{{ t('catalog.brandLine', { brand: brandForProduct(product) }) }}</div>
                <div v-if="product.presentation" class="catalog-presentation">{{ product.presentation }}</div>
              </div>
              <button
                :class="'add-btn ' + (isInCart(product.id) ? 'add-btn-added' : 'add-btn-default')"
                type="button"
                :disabled="product.status === 'out'"
                @click="toggleCartProduct(product)"
                :title="product.status === 'out' ? t('catalog.outOfStockMessage') : isInCart(product.id) ? t('catalog.remove') : t('catalog.addToRequest')"
                :aria-label="isInCart(product.id) ? t('catalog.remove') : t('catalog.addToRequest')"
              >
                <i :class="isInCart(product.id) ? 'pi pi-trash' : 'pi pi-plus'"></i>
              </button>
            </div>
            <div class="flow-row catalog-card-badges">
              <span :class="coldTypeBadge(product.coldType)">{{ coldTypeLabel(product.coldType) }}</span>
              <span class="badge-temp">{{ product.temperatureRange || product.temp }}</span>
              <span :class="'badge ' + statusBadge(product.status)">{{ statusLabel(product.status) }}</span>
            </div>
            <div class="flow-row-between catalog-card-footer">
              <strong>S/ {{ product.price.toFixed(2) }}</strong>
              <span>{{ Math.max(0, Number(product.stock || 0) - Number(product.reserved || 0)) }} {{ product.unit }}</span>
            </div>
            <small v-if="product.status === 'out'" class="catalog-stock-message" role="status">{{ t('catalog.outOfStockMessage') }}</small>
            <div v-if="isInCart(product.id)" class="catalog-card-qty" @click.stop>
              <button class="btn btn-ghost btn-sm" type="button" @click="setCartQuantity(product, cartItemFor(product.id)?.qty - 1)">-</button>
              <input
                class="qty-input"
                type="number"
                min="1"
                :max="Math.max(1, Number(product.stock || 0) - Number(product.reserved || 0))"
                :value="cartItemFor(product.id)?.qty || 1"
                @input="setCartQuantity(product, $event.target.value)"
              />
              <button class="btn btn-ghost btn-sm" type="button" @click="setCartQuantity(product, cartItemFor(product.id)?.qty + 1)">+</button>
            </div>
            <button class="btn btn-ghost btn-sm" style="width:100%;justify-content:center" type="button" @click="router.push('/portal/product-catalog/' + product.id)">
              {{ t('catalog.viewDetails') }}
            </button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.catalog-stock-message {
  color: #b91c1c;
  font-weight: 800;
}
.buyer-catalog-layout {
  grid-template-columns: minmax(250px, 300px) minmax(0, 1fr);
  align-items: stretch;
}
.catalog-results {
  min-width: 0;
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
.catalog-product-grid {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  align-items: stretch;
}
.catalog-management-card {
  display: flex;
  flex-direction: column;
  text-align: center;
  border: 1px solid #dbe5f2;
  box-shadow: none;
}
.catalog-management-card.selected {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, .14);
}
.catalog-management-card.selected:hover .add-btn-added {
  background: #fee2e2;
  border-color: #fecaca;
  color: #dc2626;
}
.catalog-visual-button {
  position: relative;
  width: 100%;
  border: 0;
  min-height: 190px;
  overflow: hidden;
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
  display: flex;
  justify-content: center;
  text-align: center;
  padding: 0 38px;
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
}
.catalog-card-footer {
  padding-top: 12px;
  border-top: 1px solid #e8eef7;
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
.catalog-card-qty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px;
  border: 1px solid #fecaca;
  border-radius: 999px;
  background: #fff7f7;
}
.catalog-card-qty .qty-input {
  width: 52px;
  height: 30px;
  border: 1px solid #fecaca;
  border-radius: 999px;
  color: #991b1b;
  font-size: 12px;
  font-weight: 900;
  text-align: center;
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
.catalog-presentation {
  margin-top: 8px;
  color: #475569;
  font-size: 12px;
  font-weight: 850;
}
@media (max-width: 1024px) {
  .buyer-catalog-layout {
    grid-template-columns: 1fr;
  }
}
</style>
