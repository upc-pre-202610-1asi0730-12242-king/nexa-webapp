<script setup>
defineProps({ form: { type: Object, required: true }, errors: { type: Object, required: true }, options: { type: Object, required: true } });
const emit = defineEmits(['update']);
</script>

<template>
  <div class="tm-fields">
    <div class="tm-field"><label>{{ $t('tenant.registration.fields.facilityName') }}</label><input :value="form.location.facilityName" @input="emit('update','location','facilityName',$event.target.value)" /><small v-if="errors.facilityName">{{ $t(errors.facilityName) }}</small></div>
    <div class="tm-field"><label>{{ $t('tenant.registration.fields.city') }}</label><select :value="form.location.city" @change="emit('update','location','city',$event.target.value)"><option v-for="item in options.cities" :key="item" :value="item">{{ $t(`tenant.registration.options.${item}`) }}</option></select><small v-if="errors.city">{{ $t(errors.city) }}</small></div>
    <div class="tm-field span-2"><label>{{ $t('tenant.registration.fields.address') }}</label><input :value="form.location.address" @input="emit('update','location','address',$event.target.value)" /><small v-if="errors.address">{{ $t(errors.address) }}</small></div>
    <div class="tm-field"><label>{{ $t('tenant.registration.fields.district') }}</label><select :value="form.location.district" @change="emit('update','location','district',$event.target.value)"><option v-for="item in options.districts" :key="item" :value="item">{{ $t(`tenant.registration.options.${item}`) }}</option></select><small v-if="errors.district">{{ $t(errors.district) }}</small></div>
    <div class="tm-field"><label>{{ $t('tenant.registration.fields.country') }}</label><select :value="form.location.country" @change="emit('update','location','country',$event.target.value)"><option v-for="item in options.countries" :key="item" :value="item">{{ $t(`tenant.registration.options.${item}`) }}</option></select><small v-if="errors.country">{{ $t(errors.country) }}</small></div>
    <div class="tm-field span-2"><label>{{ $t('tenant.registration.fields.reference') }}</label><input :value="form.location.reference" @input="emit('update','location','reference',$event.target.value)" /></div>
    <div class="tm-field"><label>{{ $t('tenant.registration.fields.warehouseCount') }}</label><input :value="form.location.warehouseCount" type="number" min="1" max="10" @input="emit('update','location','warehouseCount',Number($event.target.value))" /><small v-if="errors.warehouseCount">{{ $t(errors.warehouseCount) }}</small></div>
    <div class="tm-field"><label>{{ $t('tenant.registration.fields.coldRoomsCount') }}</label><input :value="form.location.coldRoomsCount" type="number" min="0" max="50" @input="emit('update','location','coldRoomsCount',Number($event.target.value))" /><small v-if="errors.coldRoomsCount">{{ $t(errors.coldRoomsCount) }}</small></div>
    <div class="tm-field span-2"><label>{{ $t('tenant.registration.fields.capacityEstimate') }}</label><select :value="form.location.capacityEstimate" @change="emit('update','location','capacityEstimate',$event.target.value)"><option v-for="item in options.capacities" :key="item" :value="item">{{ $t(`tenant.registration.options.${item}`) }}</option></select><small v-if="errors.capacityEstimate">{{ $t(errors.capacityEstimate) }}</small></div>
    <div class="tm-field span-2">
      <label class="tm-toggle-card" :class="{ selected: form.location.fefoEnabled }">
        <input type="checkbox" :checked="form.location.fefoEnabled" @change="emit('update','location','fefoEnabled',$event.target.checked)" />
        {{ $t('tenant.registration.fields.fefoEnabled') }}
      </label>
    </div>
  </div>
</template>
