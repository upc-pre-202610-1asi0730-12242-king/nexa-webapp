<script setup>
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDataStore } from '@/app/application/stores/data.store';

const { t, te } = useI18n();
const ds = useDataStore();
const promotions = computed(() => ds.D.promotions);
const activeCount = computed(() => promotions.value.filter(promotion => promotion.status === 'active').length);
const scheduledCount = computed(() => promotions.value.filter(promotion => promotion.status === 'scheduled').length);
const catalogLinkedCount = computed(() => promotions.value.filter(promotion => promotion.productIds?.length || promotion.catalogScope).length);
const portalReadyCount = computed(() => promotions.value.filter(promotion =>
  promotion.status === 'active' && promotion.visibility === 'buyer_portal'
).length);
const reviewCount = computed(() => promotions.value.filter(promotion =>
  ['draft', 'standby', 'inactive'].includes(promotion.status)
).length);
const uniqueProductsLinked = computed(() => new Set(promotions.value.flatMap(promotion => promotion.productIds || [])).size);
const maxChartValue = computed(() => Math.max(1, ...statusSegments.value.map(segment => segment.count)));
const showForm = ref(false);
const editingId = ref('');
const editorStep = ref(0);
const saving = ref(false);
const statusOrder = ['active', 'scheduled', 'draft', 'standby', 'inactive'];
const campaignTemplates = [
  { name: "Mother's Day chilled packs", rule: '8% buyer portal adjustment', segment: 'Food service and retail buyers', scope: 'Chilled products' },
  { name: "Father's Day grill rotation", rule: 'Bundle pricing by volume', segment: 'Hotels and distributors', scope: 'Meat & cold cuts' },
  { name: 'Frozen seafood standby', rule: 'Standby campaign until stock confirmation', segment: 'Gourmet buyers', scope: 'Seafood' },
];
const form = reactive({
  name: '',
  description: '',
  status: 'draft',
  visibility: 'buyer_portal',
  commercialRule: '',
  discountLabel: '',
  adjustmentType: 'percentage_discount',
  startDate: '',
  endDate: '',
  targetSegment: 'Gourmet buyers',
  notes: '',
  catalogScope: 'Dairy / chilled cheese',
  productIds: [],
});

const statusSegments = computed(() => statusOrder
  .map(status => ({
    key: status,
    label: promotionLabel(status),
    count: promotions.value.filter(promotion => promotion.status === status).length,
  }))
  .filter(segment => segment.count > 0));
const visibilitySegments = computed(() => buildSegments('visibility'));
const adjustmentSegments = computed(() => buildSegments('adjustmentType'));
const readinessRows = computed(() => [
  {
    label: t('promotions.readiness.buyerVisible'),
    value: portalReadyCount.value,
    detail: t('promotions.readiness.buyerVisibleDetail'),
    icon: 'pi pi-eye',
  },
  {
    label: t('promotions.readiness.products'),
    value: uniqueProductsLinked.value,
    detail: t('promotions.readiness.productsDetail'),
    icon: 'pi pi-box',
  },
  {
    label: t('promotions.readiness.review'),
    value: reviewCount.value,
    detail: t('promotions.readiness.reviewDetail'),
    icon: 'pi pi-clipboard',
  },
]);

function promotionLabel(key) {
  const labelKey = `promotions.labels.${key}`;
  return te(labelKey) ? t(labelKey) : String(key || '').replaceAll('_', ' ');
}

function categoryLabel(value) {
  const key = String(value || '').toLowerCase();
  const labelKey = `catalog.category.${key}`;
  return key && te(labelKey) ? t(labelKey) : value;
}

function buildSegments(field) {
  const totals = promotions.value.reduce((acc, promotion) => {
    const key = promotion[field] || 'not_configured';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(totals)
    .map(([key, count]) => ({ key, label: promotionLabel(key), count }))
    .sort((a, b) => b.count - a.count);
}

function percentOfTotal(count) {
  if (!promotions.value.length) return 0;
  return Math.round((count / promotions.value.length) * 100);
}

function barWidth(count) {
  return `${Math.max(8, Math.round((count / maxChartValue.value) * 100))}%`;
}

function statusClass(status) {
  if (status === 'active') return 'badge-green';
  if (status === 'scheduled') return 'badge-blue';
  if (status === 'standby') return 'badge-amber';
  return 'badge-gray';
}

function promotionProducts(promotion) {
  return (promotion.productIds || [])
    .map(productId => ds.productById(productId))
    .filter(Boolean)
    .slice(0, 3);
}

function nextAction(promotion) {
  if (promotion.status === 'active') return t('promotions.actions.active');
  if (promotion.status === 'scheduled') return t('promotions.actions.scheduled');
  if (promotion.status === 'standby') return t('promotions.actions.standby');
  if (promotion.status === 'inactive') return t('promotions.actions.inactive');
  return t('promotions.actions.default');
}

function displayDateRange(promotion) {
  const start = promotion.startDate || t('promotions.noStart');
  const end = promotion.endDate || t('promotions.noEnd');
  return `${start} - ${end}`;
}

function reset() {
  Object.assign(form, {
    name: '',
    description: '',
    status: 'draft',
    visibility: 'buyer_portal',
    commercialRule: '',
    discountLabel: '',
    adjustmentType: 'percentage_discount',
    startDate: '',
    endDate: '',
    targetSegment: 'Gourmet buyers',
    notes: '',
    catalogScope: 'Dairy / chilled cheese',
    productIds: [],
  });
  editingId.value = '';
  editorStep.value = 0;
}

function edit(promotion) {
  Object.assign(form, promotion, {
    commercialRule: promotion.commercialRule || promotion.discountLabel || '',
    adjustmentType: promotion.adjustmentType || 'percentage_discount',
    productIds: [...(promotion.productIds || [])],
  });
  editingId.value = promotion.id;
  editorStep.value = 0;
  showForm.value = true;
}

function applyTemplate(template) {
  form.name = template.name;
  form.commercialRule = template.rule;
  form.discountLabel = template.rule;
  form.targetSegment = template.segment;
  form.catalogScope = template.scope;
  form.status = template.name.includes('standby') ? 'draft' : 'scheduled';
}

async function save() {
  if (saving.value) return;
  saving.value = true;
  const payload = { ...form, discountLabel: form.discountLabel || form.commercialRule || t('promotions.defaultRule') };
  try {
    if (editingId.value) await ds.updatePromotion(editingId.value, payload);
    else await ds.addPromotion(payload);
    reset();
    showForm.value = false;
  } finally {
    saving.value = false;
  }
}

function toggleProduct(productId) {
  if (form.productIds.includes(productId)) {
    form.productIds = form.productIds.filter(id => id !== productId);
    return;
  }
  form.productIds = [...form.productIds, productId];
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">{{ t('promotions.title') }}</div>
        <div class="page-subtitle">{{ t('promotions.subtitle') }}</div>
      </div>
      <button class="btn btn-primary" type="button" @click="reset(); showForm = true"><i class="pi pi-plus"></i> {{ t('promotions.add') }}</button>
    </div>

    <section v-if="showForm" class="promotion-builder-screen">
      <div class="builder-topbar">
        <button class="btn btn-secondary" type="button" @click="showForm = false; reset()"><i class="pi pi-arrow-left"></i> {{ t('promotions.overview') }}</button>
        <div>
          <strong>{{ editingId ? t('promotions.edit') : t('promotions.newBuilder') }}</strong>
          <span>{{ t('promotions.builderDesc') }}</span>
        </div>
      </div>

      <div class="builder-stepper" :aria-label="t('promotions.setupSteps')">
        <button type="button" :class="{ active: editorStep === 0 }" @click="editorStep = 0">{{ t('promotions.steps.campaign') }}</button>
        <button type="button" :class="{ active: editorStep === 1 }" @click="editorStep = 1">{{ t('promotions.steps.catalog') }}</button>
        <button type="button" :class="{ active: editorStep === 2 }" @click="editorStep = 2">{{ t('promotions.steps.terms') }}</button>
      </div>

      <div class="promotion-layout">
        <aside class="builder-catalog">
          <div class="catalog-heading">
            <span>{{ t('promotions.chooseProducts') }}</span>
            <strong>{{ t('promotions.selected', { count: form.productIds.length }) }}</strong>
          </div>
          <button
            v-for="product in ds.D.products.slice(0, 8)"
            :key="product.id"
            type="button"
            :class="{ active: form.productIds.includes(product.id) }"
            @click="toggleProduct(product.id)"
          >
            <span>
              <strong>{{ product.name }}</strong>
              <small>{{ categoryLabel(product.category) }} · {{ product.temp || product.temperatureRange || t('promotions.coldChain') }}</small>
            </span>
            <i :class="form.productIds.includes(product.id) ? 'pi pi-check-circle' : 'pi pi-circle'"></i>
          </button>
        </aside>

        <form class="flow-panel flow-panel-pad action-form promotion-editor" @submit.prevent="save">
          <div class="editor-heading span-2">
            <strong>{{ t('promotions.campaignSetup') }}</strong>
            <span>{{ t('promotions.campaignSetupDesc') }}</span>
          </div>

          <div class="template-grid span-2">
            <button v-for="template in campaignTemplates" :key="template.name" type="button" @click="applyTemplate(template)">
              <strong>{{ template.name }}</strong>
              <span>{{ template.rule }}</span>
              <small>{{ template.scope }}</small>
            </button>
          </div>

          <label>{{ t('promotions.name') }}<input v-model="form.name" required :placeholder="t('promotions.placeholders.name')" /></label>
          <label>{{ t('common.status') }}<select v-model="form.status"><option value="active">{{ promotionLabel('active') }}</option><option value="scheduled">{{ promotionLabel('scheduled') }}</option><option value="draft">{{ promotionLabel('draft') }}</option><option value="standby">{{ promotionLabel('standby') }}</option><option value="inactive">{{ promotionLabel('inactive') }}</option></select></label>
          <label>{{ t('promotions.buyerScope') }}<select v-model="form.visibility"><option value="buyer_portal">{{ promotionLabel('buyer_portal') }}</option><option value="client_specific">{{ promotionLabel('client_specific') }}</option><option value="internal">{{ promotionLabel('internal') }}</option></select></label>
          <label>{{ t('promotions.commercialType') }}<select v-model="form.adjustmentType"><option value="percentage_discount">{{ promotionLabel('percentage_discount') }}</option><option value="tiered_price">{{ promotionLabel('tiered_price') }}</option><option value="route_priority">{{ promotionLabel('route_priority') }}</option><option value="bundle">{{ promotionLabel('bundle') }}</option></select></label>
          <label>{{ t('promotions.commercialRule') }}<input v-model="form.commercialRule" required placeholder="8% for approved B2B buyers" /></label>
          <label>{{ t('promotions.catalogScope') }}<input v-model="form.catalogScope" :placeholder="t('promotions.placeholders.catalogScope')" /></label>
          <label>{{ t('promotions.targetSegment') }}<select v-model="form.targetSegment"><option>{{ t('promotions.options.gourmetBuyers') }}</option><option>{{ t('promotions.options.foodServiceRetail') }}</option><option>{{ t('promotions.options.hotelsDistributors') }}</option><option>{{ t('promotions.options.strategicAccounts') }}</option></select></label>
          <label>{{ t('promotions.campaignCollection') }}<select v-model="form.discountLabel"><option value="">{{ t('promotions.useCommercialRule') }}</option><option>{{ t('promotions.options.mothersDay') }}</option><option>{{ t('promotions.options.fathersDay') }}</option><option>{{ t('promotions.options.inventoryRotation') }}</option><option>{{ t('promotions.options.standbyStock') }}</option></select></label>
          <label>{{ t('promotions.startDate') }}<input v-model="form.startDate" type="date" /></label>
          <label>{{ t('promotions.endDate') }}<input v-model="form.endDate" type="date" /></label>
          <label class="span-2">{{ t('promotions.buyerDescription') }}<textarea v-model="form.description" rows="3" :placeholder="t('promotions.placeholders.buyerDescription')"></textarea></label>
          <label class="span-2">{{ t('promotions.internalNotes') }}<textarea v-model="form.notes" rows="2" :placeholder="t('promotions.placeholders.internalNotes')"></textarea></label>
          <div class="form-actions span-2">
            <button class="btn btn-secondary" type="button" @click="showForm = false; reset()">{{ t('common.cancel') }}</button>
            <button class="btn btn-primary" type="submit" :disabled="saving">
              <i :class="saving ? 'pi pi-spin pi-spinner' : 'pi pi-save'"></i>
              {{ saving ? t('common.saving') : t('promotions.save') }}
            </button>
          </div>
        </form>
      </div>
    </section>

    <template v-else>
      <section class="scenario-card">
        <div class="scenario-icon"><i class="pi pi-megaphone"></i></div>
        <div>
          <strong>{{ t('promotions.scenarioTitle') }}</strong>
          <p>{{ t('promotions.scenarioDesc') }}</p>
        </div>
      </section>

      <div class="grid-4" style="margin-bottom:18px">
        <div class="card kpi-card">
          <div class="kpi-label"><i class="pi pi-megaphone"></i> {{ t('promotions.campaigns') }}</div>
          <div class="kpi-value">{{ promotions.length }}</div>
          <div class="kpi-sub">{{ t('promotions.campaignsSub') }}</div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-label"><i class="pi pi-check-circle" style="color:#16A34A"></i> {{ promotionLabel('active') }}</div>
          <div class="kpi-value" style="color:#16A34A">{{ activeCount }}</div>
          <div class="kpi-sub">{{ t('promotions.activeSub') }}</div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-label"><i class="pi pi-clock" style="color:#F59E0B"></i> {{ t('promotions.scheduled') }}</div>
          <div class="kpi-value" style="color:#F59E0B">{{ scheduledCount }}</div>
          <div class="kpi-sub">{{ t('promotions.scheduledSub') }}</div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-label"><i class="pi pi-box" style="color:#2563EB"></i> {{ t('promotions.realCatalog') }}</div>
          <div class="kpi-value" style="color:#2563EB">{{ catalogLinkedCount }}</div>
          <div class="kpi-sub">{{ t('promotions.realCatalogSub') }}</div>
        </div>
      </div>

      <section v-if="promotions.length" class="promotion-insights">
        <article class="insight-panel">
          <div class="insight-heading">
            <span>{{ t('promotions.statusMix') }}</span>
            <strong>{{ t('promotions.readyPlanned', { count: activeCount + scheduledCount }) }}</strong>
          </div>
          <div class="status-chart" :aria-label="t('promotions.statusDistribution')">
            <div v-for="segment in statusSegments" :key="segment.key" class="status-chart-row">
              <div class="status-chart-label">
                <span>{{ segment.label }}</span>
                <strong>{{ segment.count }}</strong>
              </div>
              <div class="status-chart-track">
                <span :class="'status-chart-bar ' + segment.key" :style="{ width: barWidth(segment.count) }"></span>
              </div>
            </div>
          </div>
        </article>

        <article class="insight-panel">
          <div class="insight-heading">
            <span>{{ t('promotions.commercialScope') }}</span>
            <strong>{{ t('promotions.buyerVisibleNow', { count: portalReadyCount }) }}</strong>
          </div>
          <div class="donut-list">
            <div v-for="segment in visibilitySegments" :key="segment.key" class="donut-row">
              <span>{{ segment.label }}</span>
              <div>
                <strong>{{ segment.count }}</strong>
                <small>{{ percentOfTotal(segment.count) }}%</small>
              </div>
            </div>
          </div>
        </article>

        <article class="insight-panel">
          <div class="insight-heading">
            <span>{{ t('promotions.ruleType') }}</span>
            <strong>{{ t('promotions.pricingNoGuess') }}</strong>
          </div>
          <div class="donut-list">
            <div v-for="segment in adjustmentSegments" :key="segment.key" class="donut-row">
              <span>{{ segment.label }}</span>
              <div>
                <strong>{{ segment.count }}</strong>
                <small>{{ percentOfTotal(segment.count) }}%</small>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section v-if="promotions.length" class="readiness-strip">
        <article v-for="row in readinessRows" :key="row.label">
          <i :class="row.icon"></i>
          <div>
            <strong>{{ row.value }}</strong>
            <span>{{ row.label }}</span>
            <small>{{ row.detail }}</small>
          </div>
        </article>
      </section>

      <div v-if="!promotions.length" class="empty-state">
        <div class="empty-state-icon"><i class="pi pi-database"></i></div>
        <div class="empty-state-title">{{ t('promotions.emptyTitle') }}</div>
        <div class="empty-state-desc">{{ t('promotions.emptyDesc') }}</div>
      </div>

      <div v-else class="promotion-grid">
        <article v-for="promotion in promotions" :key="promotion.id" class="promotion-card">
          <div class="promotion-card-top">
            <span :class="'badge ' + statusClass(promotion.status)">
              {{ promotionLabel(promotion.status) }}
            </span>
            <span class="flow-pill">{{ promotionLabel(promotion.visibility) }}</span>
          </div>
          <div class="promotion-card-title">
            <h2>{{ promotion.name }}</h2>
            <span>{{ promotionLabel(promotion.adjustmentType) || t('promotions.commercialRuleFallback') }}</span>
          </div>
          <p class="promotion-description">{{ promotion.description || t('promotions.noDescription') }}</p>

          <div class="promotion-rule-box">
            <span>{{ t('promotions.ruleShown') }}</span>
            <strong>{{ promotion.discountLabel || promotion.commercialRule }}</strong>
          </div>

          <div class="promotion-detail-grid">
            <div>
              <span>{{ t('promotions.catalogScope') }}</span>
              <strong>{{ promotion.catalogScope || t('promotions.commercialRuleFallback') }}</strong>
            </div>
            <div>
              <span>{{ t('promotions.validity') }}</span>
              <strong>{{ displayDateRange(promotion) }}</strong>
            </div>
            <div>
              <span>{{ t('promotions.targetSegment') }}</span>
              <strong>{{ promotion.targetSegment || 'Strategic B2B accounts' }}</strong>
            </div>
            <div>
              <span>{{ t('promotions.nextAction') }}</span>
              <strong>{{ nextAction(promotion) }}</strong>
            </div>
          </div>

          <div class="promotion-products">
            <span>{{ t('promotions.linkedProducts') }}</span>
            <div v-if="promotionProducts(promotion).length" class="promotion-product-list">
              <small v-for="product in promotionProducts(promotion)" :key="product.id">{{ product.name }}</small>
            </div>
            <strong v-else>{{ t('promotions.categoryScopeOnly') }}</strong>
          </div>

          <div v-if="promotion.notes" class="flow-note">{{ promotion.notes }}</div>
          <div class="card-actions">
            <button class="btn btn-secondary" type="button" @click="edit(promotion)">{{ t('common.edit') }}</button>
            <button class="btn btn-ghost" type="button" @click="ds.updatePromotionStatus(promotion.id, promotion.status === 'active' ? 'inactive' : 'active')">
              {{ promotion.status === 'active' ? t('promotions.markInactive') : t('promotions.activate') }}
            </button>
          </div>
        </article>
      </div>
    </template>
  </div>
</template>

<style scoped>
.scenario-card { display:flex; gap:14px; align-items:flex-start; margin:0 0 18px; padding:16px; border:1px solid #bfdbfe; border-radius:8px; background:#eff6ff; color:#1e3a8a; }
.scenario-icon { width:42px; height:42px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:white; color:#1d4ed8; }
.scenario-card strong { display:block; color:#0f172a; margin-bottom:4px; }
.scenario-card p { margin:0; color:#475569; line-height:1.55; }
.promotion-builder-screen { display:grid; gap:16px; }
.builder-topbar { display:flex; align-items:center; gap:14px; padding:14px; border:1px solid #bfdbfe; border-radius:8px; background:#eef6ff; }
.builder-topbar > div { display:grid; gap:3px; }
.builder-topbar strong { color:#0f172a; font-size:15px; }
.builder-topbar span { color:#64748b; font-size:13px; line-height:1.4; }
.builder-stepper { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
.builder-stepper button { min-height:40px; border:1px solid #d7deea; border-radius:8px; background:#fff; color:#475569; font-size:12px; font-weight:900; cursor:pointer; }
.builder-stepper button.active { border-color:#93c5fd; background:#eff6ff; color:#1d4ed8; box-shadow:inset 0 0 0 1px #bfdbfe; }
.promotion-layout { display:grid; grid-template-columns:minmax(260px,340px) minmax(0,1fr); gap:16px; align-items:start; }
.builder-catalog { display:grid; gap:8px; padding:14px; border:1px solid #d7deea; border-radius:8px; background:#fff; }
.catalog-heading { display:flex; justify-content:space-between; gap:10px; align-items:center; padding-bottom:6px; color:#64748b; font-size:12px; font-weight:800; }
.catalog-heading strong { color:#1d4ed8; }
.builder-catalog button { display:flex; justify-content:space-between; gap:10px; align-items:center; width:100%; min-height:62px; border:1px solid #e2e8f0; border-radius:8px; background:#fff; color:#334155; padding:10px 12px; text-align:left; cursor:pointer; }
.builder-catalog button.active { border-color:#93c5fd; background:#eff6ff; box-shadow:inset 0 0 0 1px #bfdbfe; }
.builder-catalog strong { display:block; color:#0f172a; font-size:13px; line-height:1.25; }
.builder-catalog small { display:block; color:#64748b; font-size:11px; line-height:1.3; margin-top:3px; }
.builder-catalog i { color:#2563eb; }
.action-form { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-bottom:18px; }
.promotion-editor { margin:0; box-shadow:none; border-color:#bfdbfe; }
.editor-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:12px; padding-bottom:4px; border-bottom:1px solid #dbeafe; }
.editor-heading strong { color:#0f172a; font-size:14px; }
.editor-heading span { color:#64748b; font-size:12px; }
.template-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
.template-grid button { display:grid; gap:4px; min-height:86px; border:1px solid #d7deea; border-radius:8px; background:#f8fafc; color:#334155; padding:10px; text-align:left; cursor:pointer; }
.template-grid button:hover { border-color:#93c5fd; background:#eff6ff; }
.template-grid strong { color:#0f172a; font-size:12px; line-height:1.25; }
.template-grid span,.template-grid small { color:#64748b; font-size:11px; line-height:1.3; }
.action-form label { display:grid; gap:6px; color:#334155; font-size:12px; font-weight:700; }
.action-form input,.action-form select,.action-form textarea { width:100%; min-height:40px; border:1px solid #d7deea; border-radius:10px; padding:0 11px; box-sizing:border-box; }
.action-form textarea { padding:10px 11px; resize:vertical; }
.span-2 { grid-column:1/-1; }
.form-actions,.card-actions { display:flex; justify-content:flex-end; gap:10px; flex-wrap:wrap; margin-top:12px; }
.promotion-insights { display:grid; grid-template-columns:1.1fr .95fr .95fr; gap:14px; margin-bottom:18px; }
.insight-panel { min-width:0; padding:16px; border:1px solid #dbeafe; border-radius:8px; background:#fff; box-shadow:0 10px 24px rgba(15,23,42,.04); }
.insight-heading { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:14px; }
.insight-heading span { color:#64748b; font-size:12px; font-weight:900; text-transform:uppercase; letter-spacing:.04em; }
.insight-heading strong { color:#0f172a; font-size:13px; text-align:right; line-height:1.35; }
.status-chart { display:grid; gap:11px; }
.status-chart-row { display:grid; gap:6px; }
.status-chart-label { display:flex; justify-content:space-between; gap:10px; color:#334155; font-size:12px; font-weight:800; }
.status-chart-label strong { color:#0f172a; }
.status-chart-track { height:9px; border-radius:999px; overflow:hidden; background:#eff6ff; }
.status-chart-bar { display:block; height:100%; border-radius:999px; background:#94a3b8; }
.status-chart-bar.active { background:#16a34a; }
.status-chart-bar.scheduled { background:#2563eb; }
.status-chart-bar.draft { background:#94a3b8; }
.status-chart-bar.standby { background:#f59e0b; }
.status-chart-bar.inactive { background:#cbd5e1; }
.donut-list { display:grid; gap:9px; }
.donut-row { display:flex; align-items:center; justify-content:space-between; gap:10px; min-height:42px; padding:8px 10px; border:1px solid #e2e8f0; border-radius:8px; background:#f8fafc; }
.donut-row > span { color:#334155; font-size:12px; font-weight:800; text-transform:capitalize; }
.donut-row div { display:flex; align-items:baseline; gap:6px; }
.donut-row strong { color:#0f172a; font-size:16px; }
.donut-row small { color:#64748b; font-size:11px; font-weight:800; }
.readiness-strip { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-bottom:18px; }
.readiness-strip article { display:flex; gap:12px; align-items:flex-start; padding:14px; border:1px solid #dbeafe; border-radius:8px; background:#f8fbff; }
.readiness-strip i { width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; background:#eff6ff; color:#2563eb; }
.readiness-strip div { min-width:0; display:grid; gap:2px; }
.readiness-strip strong { color:#0f172a; font-size:22px; line-height:1; }
.readiness-strip span { color:#334155; font-size:12px; font-weight:900; }
.readiness-strip small { color:#64748b; font-size:11px; line-height:1.35; }
.promotion-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
.promotion-card { min-width:0; display:grid; gap:12px; padding:16px; border:1px solid #dbe5f2; border-radius:8px; background:#fff; box-shadow:0 12px 26px rgba(15,23,42,.045); }
.promotion-card-top { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
.promotion-card-title { display:grid; gap:4px; }
.promotion-card-title h2 { margin:0; color:#0f172a; font-size:18px; line-height:1.25; }
.promotion-card-title span { color:#2563eb; font-size:12px; font-weight:900; }
.promotion-description { min-height:42px; margin:0; color:#64748b; font-size:13px; line-height:1.55; }
.promotion-rule-box { display:grid; gap:5px; padding:12px; border:1px solid #bfdbfe; border-radius:8px; background:#eff6ff; }
.promotion-rule-box span,.promotion-detail-grid span,.promotion-products > span { color:#64748b; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:.04em; }
.promotion-rule-box strong { color:#0f172a; font-size:14px; line-height:1.35; }
.promotion-detail-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
.promotion-detail-grid div { min-width:0; display:grid; gap:4px; padding:10px; border:1px solid #e2e8f0; border-radius:8px; background:#f8fafc; }
.promotion-detail-grid strong { color:#0f172a; font-size:12px; line-height:1.35; overflow-wrap:anywhere; }
.promotion-products { display:grid; gap:8px; }
.promotion-products > strong { color:#334155; font-size:12px; }
.promotion-product-list { display:flex; gap:6px; flex-wrap:wrap; }
.promotion-product-list small { padding:6px 9px; border:1px solid #dbeafe; border-radius:999px; background:#f8fbff; color:#334155; font-size:11px; font-weight:800; }
@media (max-width:1080px){ .promotion-insights,.promotion-grid { grid-template-columns:1fr; } }
@media (max-width:980px){ .promotion-layout,.readiness-strip { grid-template-columns:1fr; } .template-grid { grid-template-columns:1fr; } }
@media (max-width:720px){ .action-form,.builder-stepper,.promotion-detail-grid { grid-template-columns:1fr; } .span-2 { grid-column:auto; } .builder-topbar { align-items:flex-start; flex-direction:column; } .promotion-card-top,.insight-heading { flex-direction:column; } .insight-heading strong { text-align:left; } }
</style>
