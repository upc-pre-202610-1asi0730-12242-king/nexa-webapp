<script setup>
defineProps({ form: { type: Object, required: true }, errors: { type: Object, required: true }, workspaceUrl: { type: String, required: true } });
const emit = defineEmits(['update']);
</script>

<template>
  <div class="review-submit">
    <section class="review-brief">
      <div>
        <span>{{ $t('tenant.registration.reviewTitle') }}</span>
        <strong>{{ form.company.tradeName || form.company.legalName }} · {{ workspaceUrl }}</strong>
        <p>{{ $t('tenant.registration.reviewDesc') }}</p>
      </div>
      <div class="review-score">
        <strong>{{ form.company.companyMemberCount }}/100</strong>
        <span>{{ $t('tenant.registration.members') }}</span>
      </div>
    </section>
    <div class="review-grid">
      <div><span>{{ $t('tenant.registration.sections.company') }}</span><strong>{{ form.company.legalName }}</strong><small>{{ form.company.taxId }} · {{ $t(`tenant.registration.options.${form.company.industrySector}`) }} · {{ $t(`tenant.registration.options.${form.company.country}`) }}</small><small>{{ form.company.website }}</small></div>
      <div><span>{{ $t('tenant.registration.sections.operation') }}</span><strong>{{ $t(`tenant.registration.options.${form.operation.operationType}`) }}</strong><small>{{ form.operation.minTemperature }}°C / {{ form.operation.maxTemperature }}°C · {{ $t(`tenant.registration.options.${form.operation.monthlyVolume}`) }}</small><small>{{ $t(`tenant.registration.options.${form.operation.deliveryCoverage}`) }}</small></div>
      <div><span>{{ $t('tenant.registration.sections.location') }}</span><strong>{{ form.location.facilityName }}</strong><small>{{ $t(`tenant.registration.options.${form.location.city}`) }} · {{ $t(`tenant.registration.options.${form.location.district}`) }} · {{ $t(`tenant.registration.options.${form.location.country}`) }}</small><small>{{ form.location.warehouseCount }} warehouses · {{ form.location.coldRoomsCount }} cold rooms · {{ $t(`tenant.registration.options.${form.location.capacityEstimate}`) }}</small></div>
      <div><span>{{ $t('tenant.registration.sections.administrator') }}</span><strong>{{ form.administrator.firstName }} {{ form.administrator.lastName }}</strong><small>{{ form.administrator.jobTitle }} · {{ $t(`tenant.companyAdmin.roles.${form.administrator.roleAfterApproval}`) }}</small><small>{{ form.administrator.email }} · {{ form.administrator.phonePrefix }} {{ form.administrator.phone }}</small></div>
      <div><span>{{ $t('tenant.registration.sections.workspace') }}</span><strong>{{ workspaceUrl }}</strong><small>{{ form.workspace.displayName }} · @{{ form.workspace.emailDomain }}</small><small>{{ $t('tenant.registration.reviewPolicy') }}</small></div>
      <div><span>{{ $t('tenant.registration.fields.plan') }}</span><strong>{{ form.workspace.plan }}</strong><small>{{ $t(`tenant.registration.planDescriptions.${form.workspace.plan}`) }}</small></div>
    </div>
    <div class="review-categories">
      <span v-for="category in form.operation.productCategories" :key="category">{{ $t(`tenant.registration.options.${category}`) }}</span>
    </div>
    <div class="capability-list"><span v-for="capability in form.workspace.capabilities" :key="capability">{{ $t(`tenant.capabilities.${capability}`) }}</span></div>
    <label class="terms" :class="{ selected: form.workspace.termsAccepted }"><input type="checkbox" :checked="form.workspace.termsAccepted" @change="emit('update','workspace','termsAccepted',$event.target.checked)" /> {{ $t('tenant.registration.fields.termsAccepted') }}</label>
    <small v-if="errors.termsAccepted" class="terms-error">{{ $t(errors.termsAccepted) }}</small>
    <small v-if="errors.submit" class="terms-error">{{ $t(errors.submit) }}</small>
  </div>
</template>

<style scoped>
.review-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
.review-brief { display:flex; justify-content:space-between; gap:14px; align-items:center; margin-bottom:12px; padding:14px; border:1px solid #bfdbfe; border-radius:14px; background:linear-gradient(135deg,#eff6ff,#f8fafc); }
.review-brief span { color:#1d4ed8; font-size:11px; font-weight:900; text-transform:uppercase; }
.review-brief strong { display:block; margin-top:4px; color:#0f172a; font-size:16px; overflow-wrap:anywhere; }
.review-brief p { margin:4px 0 0; color:#475569; font-size:12px; line-height:1.45; }
.review-score { min-width:92px; text-align:center; padding:10px; border-radius:12px; background:#fff; border:1px solid #dbeafe; }
.review-score strong { font-size:18px; color:#1d4ed8; }
.review-grid div { padding:12px; border:1px solid #e2e8f0; border-radius:12px; background:white; }
.review-grid span { display:block; color:#64748b; font-size:11px; margin-bottom:4px; }
.review-grid strong { color:#0f172a; font-size:13px; overflow-wrap:anywhere; }
.review-grid small { display:block; margin-top:4px; color:#64748b; font-size:12px; line-height:1.4; }
.review-categories { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
.review-categories span { padding:6px 10px; border:1px solid #dbeafe; border-radius:999px; background:#f8fbff; color:#334155; font-size:12px; font-weight:800; }
.capability-list { display:flex; flex-wrap:wrap; gap:8px; margin-top:14px; }
.capability-list span { padding:6px 10px; border-radius:999px; background:#eff6ff; color:#1d4ed8; font-size:12px; font-weight:700; }
.terms { position:relative; display:flex; gap:10px; align-items:flex-start; margin-top:16px; padding:12px 14px; border:1px solid #dbe3ef; border-radius:12px; background:#fff; color:#334155; font-size:13px; font-weight:700; cursor:pointer; }
.terms-error { display:block; color:#b91c1c; margin-top:6px; font-size:12px; }
@media (max-width: 620px) { .review-grid { grid-template-columns:1fr; } }
</style>

