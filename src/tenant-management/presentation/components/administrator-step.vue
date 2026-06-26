<script setup>
import { computed } from 'vue';

const props = defineProps({
  form: { type: Object, required: true },
  errors: { type: Object, required: true },
  warning: { type: String, default: '' },
  options: { type: Object, required: true },
});
const emit = defineEmits(['update']);
const roleLabelKey = computed(() => `tenant.companyAdmin.roles.${props.form.administrator.roleAfterApproval}`);
</script>

<template>
  <div class="tm-fields">
    <div class="tm-field"><label>{{ $t('tenant.registration.fields.firstName') }}</label><input :value="form.administrator.firstName" @input="emit('update','administrator','firstName',$event.target.value)" /><small v-if="errors.firstName">{{ $t(errors.firstName) }}</small></div>
    <div class="tm-field"><label>{{ $t('tenant.registration.fields.lastName') }}</label><input :value="form.administrator.lastName" @input="emit('update','administrator','lastName',$event.target.value)" /><small v-if="errors.lastName">{{ $t(errors.lastName) }}</small></div>
    <div class="tm-field"><label>{{ $t('tenant.registration.fields.jobTitle') }}</label><input :value="form.administrator.jobTitle" @input="emit('update','administrator','jobTitle',$event.target.value)" /></div>
    <div class="tm-field"><label>{{ $t('tenant.registration.fields.email') }}</label><input type="email" :value="form.administrator.email" @input="emit('update','administrator','email',$event.target.value)" /><small v-if="errors.email">{{ $t(errors.email) }}</small><small v-else-if="warning" class="warn">{{ $t(warning) }}</small></div>
    <div class="tm-field"><label>{{ $t('tenant.registration.fields.phonePrefix') }}</label><select :value="form.administrator.phonePrefix" @change="emit('update','administrator','phonePrefix',$event.target.value)"><option v-for="item in options.phonePrefixes" :key="item" :value="item">{{ $t(`tenant.registration.options.phonePrefixes.${item}`) }}</option></select><small v-if="errors.phonePrefix">{{ $t(errors.phonePrefix) }}</small></div>
    <div class="tm-field"><label>{{ $t('tenant.registration.fields.phone') }}</label><input :value="form.administrator.phone" inputmode="tel" @input="emit('update','administrator','phone',$event.target.value)" /><small v-if="errors.phone">{{ $t(errors.phone) }}</small></div>
    <div class="tm-field"><label>{{ $t('tenant.registration.fields.preferredLanguage') }}</label><select :value="form.administrator.preferredLanguage" @change="emit('update','administrator','preferredLanguage',$event.target.value)"><option v-for="item in options.languages" :key="item" :value="item">{{ $t(`tenant.registration.options.languages.${item}`) }}</option></select></div>
    <div class="tm-field span-2">
      <label>{{ $t('tenant.registration.fields.roleAfterApproval') }}</label>
      <div class="role-lock">
        <strong>{{ $t(roleLabelKey) }}</strong>
        <span>{{ $t('tenant.registration.ownerRoleHelp') }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.role-lock {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  background: #eff6ff;
}
.role-lock strong {
  color: #1d4ed8;
  font-size: 13px;
}
.role-lock span {
  color: #475569;
  font-size: 12px;
  line-height: 1.45;
}
</style>

