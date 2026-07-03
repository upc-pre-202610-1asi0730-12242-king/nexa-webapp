<script setup>
import { reactive, ref, watch } from 'vue';

const props = defineProps({
  billing: { type: Object, required: true },
  usage: { type: Object, required: true },
  saving: { type: Boolean, default: false },
  error: { type: String, default: '' },
  saveBilling: { type: Function, required: true },
});
const editing = ref(false);
const localError = ref('');
const draft = reactive({
  plan: '',
  seats: 0,
  paymentStatus: '',
  nextBillingDate: '',
  billingContact: '',
});
const plans = [
  { key: 'Starter', tag: 'starter', limit: '10', tone: 'starter', price: 'starter', features: ['users10', 'catalog', 'basicRequests', 'oneWarehouse'] },
  { key: 'Standard', tag: 'current', limit: '50', tone: 'standard', price: 'standard', features: ['users50', 'warehouse', 'inventoryLots', 'dispatchTracking', 'buyerPortal'] },
  { key: 'Professional', tag: 'next', limit: '100', tone: 'professional', price: 'professional', features: ['users100', 'temperatureLogs', 'promotions', 'rules', 'documents'] },
  { key: 'Enterprise', tag: 'advanced', limit: 'custom', tone: 'enterprise', price: 'enterprise', features: ['customOnboarding', 'advancedPermissions', 'ssoReady', 'support'] },
];
const usageRows = ['users', 'warehouses', 'monthlyRequests', 'dispatches', 'documents'];

watch(() => props.billing, value => Object.assign(draft, value), { immediate: true });

function cancel() {
  Object.assign(draft, props.billing);
  editing.value = false;
}

async function save() {
  localError.value = '';
  try {
    await props.saveBilling({
      plan: draft.plan,
      seats: Number(draft.seats || 0),
      paymentStatus: draft.paymentStatus,
      nextBillingDate: draft.nextBillingDate,
      billingContact: draft.billingContact,
    });
    editing.value = false;
  } catch {
    localError.value = 'tenant.companyAdmin.billing.saveError';
  }
}

function choosePlan(plan) {
  draft.plan = plan.key;
  editing.value = true;
}
</script>

<template>
  <section class="admin-section">
    <div class="billing-hero section-card">
      <div>
        <span>{{ $t('tenant.companyAdmin.billing.heroEyebrow') }}</span>
        <h3>{{ $t('tenant.companyAdmin.billing.heroTitle') }}</h3>
        <p>{{ $t('tenant.companyAdmin.billing.heroDesc') }}</p>
      </div>
      <button type="button" class="admin-button primary" @click="editing = true">{{ $t('tenant.companyAdmin.billing.comparePlans') }}</button>
    </div>
    <div class="section-toolbar">
      <button v-if="!editing" type="button" @click="editing = true">{{ $t('common.edit') }}</button>
    </div>

    <div class="billing-main-grid">
      <form class="section-card billing-settings" :class="{ editing }" @submit.prevent="save">
        <div class="billing-settings-head">
          <div>
            <span>{{ editing ? $t('tenant.companyAdmin.billing.editingPreview') : $t('tenant.companyAdmin.billing.currentConfiguration') }}</span>
            <h3>{{ billing.plan }}</h3>
          </div>
          <span class="status-pill active">{{ billing.seats }} {{ $t('tenant.companyAdmin.billing.seatsUnit') }}</span>
        </div>
        <div class="billing-field-grid">
          <label>
            <span>{{ $t('tenant.companyAdmin.billing.plan') }}</span>
            <select v-if="editing" v-model="draft.plan" class="billing-control"><option>Starter</option><option>Standard</option><option>Professional</option><option>Enterprise</option></select>
            <strong v-else>{{ billing.plan }}</strong>
            <small>{{ $t('tenant.companyAdmin.billing.planDesc') }}</small>
          </label>
          <label>
            <span>{{ $t('tenant.companyAdmin.billing.seats') }}</span>
            <input v-if="editing" v-model.number="draft.seats" class="billing-control" type="number" min="1" max="100" />
            <strong v-else>{{ billing.seats }}</strong>
            <small>{{ $t('tenant.companyAdmin.billing.seatsDesc') }}</small>
          </label>
          <label>
            <span>{{ $t('tenant.companyAdmin.billing.paymentStatus') }}</span>
            <select v-if="editing" v-model="draft.paymentStatus" class="billing-control"><option value="review_active">{{ $t('tenant.companyAdmin.billing.status.review_active') }}</option><option value="review_required">{{ $t('tenant.companyAdmin.billing.status.review_required') }}</option></select>
            <strong v-else>{{ $t(`tenant.companyAdmin.billing.status.${billing.paymentStatus}`) }}</strong>
            <small>{{ $t('tenant.companyAdmin.billing.paymentStatusDesc') }}</small>
          </label>
          <label>
            <span>{{ $t('tenant.companyAdmin.billing.nextBillingDate') }}</span>
            <input v-if="editing" v-model="draft.nextBillingDate" class="billing-control" type="date" />
            <strong v-else>{{ billing.nextBillingDate || $t('common.notConfigured') }}</strong>
            <small>{{ $t('tenant.companyAdmin.billing.nextBillingDateDesc') }}</small>
          </label>
          <label>
            <span>{{ $t('tenant.companyAdmin.billing.billingContact') }}</span>
            <input v-if="editing" v-model="draft.billingContact" class="billing-control" type="email" />
            <strong v-else>{{ billing.billingContact || $t('common.notConfigured') }}</strong>
            <small>{{ $t('tenant.companyAdmin.billing.billingContactDesc') }}</small>
          </label>
          <label class="invoicing-control">
            <span>{{ $t('tenant.companyAdmin.billing.invoicingScope') }}</span>
            <strong>{{ $t('common.enabled') }}</strong>
            <small>{{ $t('tenant.companyAdmin.billing.invoicingScopeDesc') }}</small>
          </label>
        </div>
        <p v-if="localError || error" class="billing-error">{{ $t(localError || error) }}</p>
        <div v-if="editing" class="section-toolbar inline-actions">
          <button type="button" :disabled="saving" @click="cancel">{{ $t('common.cancel') }}</button>
          <button class="primary admin-button" type="submit" :disabled="saving">{{ saving ? $t('common.loading') : $t('common.save') }}</button>
        </div>
      </form>

      <div class="usage-grid">
        <article v-for="key in usageRows" :key="key">
          <span>{{ $t(`tenant.companyAdmin.billing.usage.${key}`) }}</span>
          <strong>{{ usage[key] || 0 }}</strong>
        </article>
      </div>
    </div>

    <div class="plan-card-grid">
      <article v-for="plan in plans" :key="plan.key" class="plan-card" :class="[plan.tone, { active: billing.plan === plan.key }]">
        <div class="plan-card-top">
          <div>
            <span class="plan-tag">{{ $t(`tenant.companyAdmin.billing.planTags.${plan.tag}`) }}</span>
            <h3>{{ plan.key }}</h3>
          </div>
          <span v-if="billing.plan === plan.key" class="status-pill active">{{ $t('tenant.companyAdmin.billing.currentPlan') }}</span>
        </div>
        <span class="plan-price">{{ $t(`tenant.companyAdmin.billing.planPrices.${plan.price}`) }}</span>
        <strong class="plan-limit">{{ plan.limit === 'custom' ? $t('tenant.companyAdmin.billing.customLimit') : plan.limit + ' ' + $t('tenant.companyAdmin.billing.usersLimit') }}</strong>
        <ul>
          <li v-for="feature in plan.features" :key="feature">{{ $t(`tenant.companyAdmin.billing.features.${feature}`) }}</li>
        </ul>
        <button type="button" class="admin-button ghost plan-action" @click="choosePlan(plan)">{{ billing.plan === plan.key ? $t('tenant.companyAdmin.billing.currentPlan') : $t('tenant.companyAdmin.billing.requestPlan') }}</button>
      </article>
    </div>
    <p class="admin-note">{{ $t('tenant.companyAdmin.billing.note') }}</p>
  </section>
</template>

<style scoped>
.usage-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.billing-main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, .75fr);
  gap: 14px;
  align-items: stretch;
}
.billing-settings {
  display: grid;
  gap: 16px;
}
.billing-settings.editing {
  border-color: #93c5fd;
  background:
    radial-gradient(circle at 100% 0%, rgba(37,99,235,.08), transparent 32%),
    linear-gradient(180deg,#ffffff,#eff6ff);
}
.billing-settings-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}
.billing-settings-head span:first-child {
  color: #2563eb;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}
.billing-settings-head h3 {
  margin: 4px 0 0;
  font-size: 22px;
}
.billing-field-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.billing-field-grid label {
  display: grid;
  gap: 6px;
  min-height: 116px;
  align-content: start;
  padding: 13px;
  border: 1px solid #dbe5f2;
  border-radius: 16px;
  background: #fff;
}
.billing-field-grid label > span {
  color: #64748b;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}
.billing-field-grid label strong {
  margin: 0;
  font-size: 15px;
}
.billing-field-grid label small {
  color: #64748b;
  font-size: 11px;
  line-height: 1.35;
}
.billing-control {
  width: 100%;
  min-height: 42px;
  border: 1px solid #cbd8ea;
  border-radius: 12px;
  background: linear-gradient(180deg,#ffffff,#f8fbff);
  color: #0f172a;
  padding: 0 12px;
  box-sizing: border-box;
}
.billing-error {
  margin: 0;
  color: #b91c1c;
  font-size: 12px;
  font-weight: 800;
}
.usage-grid article,
.plan-card {
  border: 1px solid #dbe5f2;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff, #fbfdff);
  padding: 18px;
  box-shadow: 0 12px 28px rgba(15,23,42,.045);
}
.usage-grid article {
  min-height: 116px;
  align-content: center;
  display: grid;
}
.usage-grid span {
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
}
.usage-grid strong {
  color: #0f172a;
  font-size: 16px;
}
.usage-bar {
  height: 7px;
  margin-top: 10px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}
.usage-bar i {
  display: block;
  width: 54%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #60a5fa, #2563eb);
}
.plan-card-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.plan-card {
  min-height: 320px;
  display: flex;
  flex-direction: column;
}
.plan-card.active {
  border-color: #93c5fd;
  background: #eff6ff;
  box-shadow: inset 0 0 0 1px #bfdbfe;
}
.plan-card.starter { border-top: 4px solid #93c5fd; }
.plan-card.standard { border-top: 4px solid #2563eb; }
.plan-card.professional { border-top: 4px solid #0ea5e9; }
.plan-card.enterprise { border-top: 4px solid #1e40af; }
.plan-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.plan-card h3 {
  margin: 4px 0 0;
  font-size: 19px;
}
.plan-limit {
  margin-top: 14px;
  color: #0f172a;
  font-size: 22px;
}
.plan-price {
  display: block;
  margin-top: 14px;
  color: #475569;
  font-size: 13px;
  font-weight: 900;
}
.plan-card ul {
  margin: 14px 0 0 16px;
  color: #334155;
  font-size: 13px;
  line-height: 1.65;
}
.plan-action {
  width: 100%;
  margin-top: auto;
  justify-content: center;
}
.billing-hero {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  background: linear-gradient(135deg, #eff6ff, #ffffff);
  border-color: #bfdbfe;
}
.billing-hero span,
.plan-tag {
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}
.billing-hero p {
  margin: 4px 0 0;
  color: #475569;
  font-size: 13px;
  line-height: 1.55;
}
@media (max-width: 1050px) {
  .billing-main-grid {
    grid-template-columns: 1fr;
  }
  .plan-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .billing-field-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 620px) {
  .billing-hero {
    align-items: flex-start;
    flex-direction: column;
  }
  .usage-grid,
  .plan-card-grid,
  .billing-field-grid {
    grid-template-columns: 1fr;
  }
}
</style>
