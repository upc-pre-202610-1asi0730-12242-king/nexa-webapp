<script setup>
import WorkspaceSlugPreview from './workspace-slug-preview.vue';
defineProps({
  form: { type: Object, required: true },
  errors: { type: Object, required: true },
  availability: { type: Object, required: true },
  workspaceUrl: { type: String, required: true },
  options: { type: Object, required: true },
});
const emit = defineEmits(['update']);
</script>

<template>
  <div class="tm-fields">
    <div class="tm-field"><label>{{ $t('tenant.registration.fields.workspaceName') }}</label><input :value="form.workspace.workspaceName" @input="emit('update','workspace','workspaceName',$event.target.value)" /><small v-if="errors.workspaceName">{{ $t(errors.workspaceName) }}</small></div>
    <div class="tm-field"><label>{{ $t('tenant.registration.fields.workspaceSlug') }}</label><input :value="form.workspace.workspaceSlug" @input="emit('update','workspace','workspaceSlug',$event.target.value)" /><small v-if="errors.workspaceSlug">{{ $t(errors.workspaceSlug) }}</small></div>
    <WorkspaceSlugPreview class="span-2" :url="workspaceUrl" :availability="availability" />
    <div class="tm-field span-2">
      <label>{{ $t('tenant.registration.fields.plan') }}</label>
      <div class="plan-grid">
        <button
          v-for="plan in options.plans"
          :key="plan"
          type="button"
          class="plan-card"
          :class="{ selected: form.workspace.plan === plan }"
          @click="emit('update','workspace','plan',plan)"
        >
          <small>{{ $t(`tenant.registration.planLabels.${plan}`) }}</small>
          <strong>{{ plan }}</strong>
          <span>{{ $t(`tenant.registration.planDescriptions.${plan}`) }}</span>
          <ul>
            <li v-for="benefit in $tm(`tenant.registration.planBenefits.${plan}`)" :key="benefit">{{ benefit }}</li>
          </ul>
        </button>
      </div>
      <small v-if="errors.plan">{{ $t(errors.plan) }}</small>
    </div>
    <div class="tm-field"><label>{{ $t('tenant.registration.fields.displayName') }}</label><input :value="form.workspace.displayName" @input="emit('update','workspace','displayName',$event.target.value)" /></div>
    <div class="tm-field"><label>{{ $t('tenant.registration.fields.emailDomain') }}</label><input :value="form.workspace.emailDomain" @input="emit('update','workspace','emailDomain',$event.target.value)" /></div>
    <div class="tm-field span-2"><label>{{ $t('tenant.registration.fields.capabilities') }}</label><div class="capability-list"><span v-for="capability in form.workspace.capabilities" :key="capability">{{ $t(`tenant.capabilities.${capability}`) }}</span></div></div>
  </div>
</template>

<style scoped>
.capability-list { display:flex; flex-wrap:wrap; gap:8px; }
.capability-list span { padding:6px 10px; border-radius:999px; background:#eff6ff; color:#1d4ed8; font-size:12px; font-weight:700; }
.plan-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
.plan-card { min-height:172px; display:grid; align-content:start; gap:6px; border:1px solid #dbe3ef; border-radius:13px; background:#fff; padding:13px; text-align:left; cursor:pointer; color:#334155; }
.plan-card small { width:max-content; padding:4px 8px; border-radius:999px; background:#f1f5f9; color:#475569; font-size:10px; font-weight:900; text-transform:uppercase; }
.plan-card strong { color:#0f172a; font-size:14px; }
.plan-card span { color:#64748b; font-size:12px; line-height:1.4; }
.plan-card ul { margin:4px 0 0; padding-left:16px; color:#475569; font-size:11px; line-height:1.45; }
.plan-card.selected { border-color:#93c5fd; background:#eff6ff; box-shadow:inset 0 0 0 1px #bfdbfe; }
.plan-card.selected strong { color:#1d4ed8; }
.plan-card.selected small { background:#dbeafe; color:#1d4ed8; }
@media (max-width: 620px) { .plan-grid { grid-template-columns:1fr; } }
</style>
