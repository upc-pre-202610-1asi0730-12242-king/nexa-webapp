<script setup>
import { useI18n } from 'vue-i18n';

const { t, te } = useI18n();

function methodTypeLabel(type) {
  const key = `portal.payments.methodTypes.${type}`;
  return te(key) ? t(key) : type;
}

defineProps({
  method: { type: Object, required: true },
  active: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

defineEmits(['select']);
</script>

<template>
  <button class="nexa-select-card" :class="{ active }" type="button" :disabled="disabled" @click="$emit('select')">
    <i class="pi pi-credit-card"></i>
    <span>
      <strong>{{ method.label || method.brand || t('portal.payments.paymentOption') }}</strong>
      <small>{{ method.brand || method.type }} · {{ methodTypeLabel(method.type) }} · **** {{ method.last4 || t('portal.payments.linked') }}</small>
    </span>
    <i v-if="active" class="pi pi-check"></i>
  </button>
</template>

