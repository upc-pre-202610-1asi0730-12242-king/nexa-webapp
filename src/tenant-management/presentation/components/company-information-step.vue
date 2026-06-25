<script setup>
import LogoUploadPreview from './logo-upload-preview.vue';
defineProps({ form: { type: Object, required: true }, errors: { type: Object, required: true }, options: { type: Object, required: true } });
const emit = defineEmits(['update', 'logo']);
</script>

<template>
  <div class="tm-fields">
    <div class="tm-field"><label>{{ $t('tenant.registration.fields.legalName') }}</label><input :value="form.company.legalName" @input="emit('update','company','legalName',$event.target.value)" /><small v-if="errors.legalName">{{ $t(errors.legalName) }}</small></div>
    <div class="tm-field"><label>{{ $t('tenant.registration.fields.tradeName') }}</label><input :value="form.company.tradeName" @input="emit('update','company','tradeName',$event.target.value)" /></div>
    <div class="tm-field"><label>{{ $t('tenant.registration.fields.taxId') }}</label><input :value="form.company.taxId" inputmode="numeric" maxlength="14" @input="emit('update','company','taxId',$event.target.value)" /><small class="hint">{{ $t('tenant.registration.rucHelp') }}</small><small v-if="errors.taxId">{{ $t(errors.taxId) }}</small></div>
    <div class="tm-field">
      <label>{{ $t('tenant.registration.fields.industrySector') }}</label>
      <select :value="form.company.industrySector" @change="emit('update','company','industrySector',$event.target.value)">
        <option v-for="item in options.industrySectors" :key="item" :value="item">{{ $t(`tenant.registration.options.${item}`) }}</option>
      </select>
      <small v-if="errors.industrySector">{{ $t(errors.industrySector) }}</small>
    </div>
    <div class="tm-field span-2 company-size-slider">
      <label>{{ $t('tenant.registration.fields.companySize') }}</label>
      <div class="slider-head">
        <strong>{{ form.company.companyMemberCount }} {{ $t('tenant.registration.members') }}</strong>
        <span>{{ $t(`tenant.registration.options.${form.company.companySize}`) }}</span>
      </div>
      <input
        type="range"
        min="1"
        max="100"
        step="1"
        :value="form.company.companyMemberCount"
        @input="emit('update','company','companyMemberCount',Number($event.target.value))"
      />
      <div class="slider-marks"><span>1</span><span>25</span><span>50</span><span>75</span><span>100 max</span></div>
      <small class="hint">{{ $t('tenant.registration.companySizeHelp') }}</small>
      <small v-if="errors.companyMemberCount">{{ $t(errors.companyMemberCount) }}</small>
    </div>
    <div class="tm-field">
      <label>{{ $t('tenant.registration.fields.country') }}</label>
      <select :value="form.company.country" @change="emit('update','company','country',$event.target.value)">
        <option v-for="item in options.countries" :key="item" :value="item">{{ $t(`tenant.registration.options.${item}`) }}</option>
      </select>
      <small v-if="errors.country">{{ $t(errors.country) }}</small>
    </div>
    <div class="tm-field"><label>{{ $t('tenant.registration.fields.website') }}</label><input type="url" :value="form.company.website" placeholder="https://empresa.pe" @input="emit('update','company','website',$event.target.value)" /><small class="hint">{{ $t('tenant.registration.websiteHelp') }}</small><small v-if="errors.website">{{ $t(errors.website) }}</small></div>
    <LogoUploadPreview class="span-2" :preview="form.company.logoPreview" :error="errors.logoPreview" @select="file => emit('logo', file)" />
  </div>
</template>

<style scoped>
.company-size-slider {
  padding: 16px;
  border: 1px solid #dbeafe;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fbff, #ffffff);
  box-shadow: inset 0 0 0 1px rgba(191, 219, 254, .45);
}
.slider-head,
.slider-marks {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: #64748b;
  font-size: 12px;
}
.slider-head strong {
  color: #0f172a;
  font-size: 14px;
}
.slider-head span {
  color: #1d4ed8;
  font-weight: 800;
}
.company-size-slider input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 10px;
  margin: 16px 0 12px;
  border-radius: 999px;
  background: linear-gradient(90deg, #2563eb, #60a5fa);
  outline: none;
}
.company-size-slider input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border: 4px solid #ffffff;
  border-radius: 999px;
  background: #2563eb;
  box-shadow: 0 8px 18px rgba(37, 99, 235, .26);
  cursor: pointer;
}
.company-size-slider input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border: 4px solid #ffffff;
  border-radius: 999px;
  background: #2563eb;
  box-shadow: 0 8px 18px rgba(37, 99, 235, .26);
  cursor: pointer;
}
.slider-marks span:last-child {
  color: #b91c1c;
  font-weight: 800;
}
</style>

