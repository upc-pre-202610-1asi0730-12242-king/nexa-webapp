<script setup>
defineProps({ form: { type: Object, required: true }, errors: { type: Object, required: true }, options: { type: Object, required: true } });
const emit = defineEmits(['update', 'category']);
</script>

<template>
  <div class="tm-fields">
    <div class="tm-field"><label>{{ $t('tenant.registration.fields.operationType') }}</label><select :value="form.operation.operationType" @change="emit('update','operation','operationType',$event.target.value)"><option v-for="item in options.operationTypes" :key="item" :value="item">{{ $t(`tenant.registration.options.${item}`) }}</option></select><small v-if="errors.operationType">{{ $t(errors.operationType) }}</small></div>
    <div class="tm-field"><label>{{ $t('tenant.registration.fields.monthlyVolume') }}</label><select :value="form.operation.monthlyVolume" @change="emit('update','operation','monthlyVolume',$event.target.value)"><option v-for="item in options.volumeRanges" :key="item" :value="item">{{ $t(`tenant.registration.options.${item}`) }}</option></select></div>
    <div class="tm-field">
      <label>{{ $t('tenant.registration.fields.deliveryCoverage') }}</label>
      <select :value="form.operation.deliveryCoverage" @change="emit('update','operation','deliveryCoverage',$event.target.value)">
        <option v-for="item in options.deliveryCoverages" :key="item" :value="item">{{ $t(`tenant.registration.options.${item}`) }}</option>
      </select>
      <small v-if="errors.deliveryCoverage">{{ $t(errors.deliveryCoverage) }}</small>
    </div>
    <div class="tm-field">
      <label>{{ $t('tenant.registration.fields.minTemperature') }}</label>
      <div class="tm-input-suffix"><input :value="form.operation.minTemperature" type="number" min="-30" max="20" @input="emit('update','operation','minTemperature',Number($event.target.value))" /><span>°C</span></div>
    </div>
    <div class="tm-field">
      <label>{{ $t('tenant.registration.fields.maxTemperature') }}</label>
      <div class="tm-input-suffix"><input :value="form.operation.maxTemperature" type="number" min="-30" max="20" @input="emit('update','operation','maxTemperature',Number($event.target.value))" /><span>°C</span></div>
      <small v-if="errors.temperatureRange">{{ $t(errors.temperatureRange) }}</small>
    </div>
    <div class="tm-field span-2">
      <label>{{ $t('tenant.registration.fields.productCategories') }}</label>
      <small class="hint">{{ $t('tenant.registration.categoryHelp') }}</small>
      <div class="tm-category-grid">
        <label v-for="item in options.productCategories" :key="item" class="tm-check-card" :class="{ selected: form.operation.productCategories.includes(item) }">
          <input type="checkbox" :checked="form.operation.productCategories.includes(item)" @change="emit('category', item, $event.target.checked)" />
          {{ $t(`tenant.registration.options.${item}`) }}
        </label>
      </div>
      <small v-if="errors.productCategories">{{ $t(errors.productCategories) }}</small>
    </div>
    <div class="tm-field span-2">
      <div class="tm-toggle-grid">
        <label class="tm-toggle-card" :class="{ selected: form.operation.refrigeratedStorage }"><input type="checkbox" :checked="form.operation.refrigeratedStorage" @change="emit('update','operation','refrigeratedStorage',$event.target.checked)" /> {{ $t('tenant.registration.fields.refrigeratedStorage') }}</label>
        <label class="tm-toggle-card" :class="{ selected: form.operation.requiresTraceability }"><input type="checkbox" :checked="form.operation.requiresTraceability" @change="emit('update','operation','requiresTraceability',$event.target.checked)" /> {{ $t('tenant.registration.fields.requiresTraceability') }}</label>
        <label class="tm-toggle-card" :class="{ selected: form.operation.requiresTemperatureAlerts }"><input type="checkbox" :checked="form.operation.requiresTemperatureAlerts" @change="emit('update','operation','requiresTemperatureAlerts',$event.target.checked)" /> {{ $t('tenant.registration.fields.requiresTemperatureAlerts') }}</label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tm-category-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 10px;
}
.tm-category-grid :deep(.tm-check-card) {
  min-height: 54px;
  padding: 12px 14px;
  border-radius: 16px;
}
.tm-category-grid :deep(.tm-check-card::before) {
  margin-right: 2px;
}
@media (max-width: 620px) {
  .tm-category-grid {
    grid-template-columns: 1fr;
  }
}
</style>

