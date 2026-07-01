<script setup>
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
      <strong>{{ method.label || method.brand || 'Payment option' }}</strong>
      <small>{{ method.brand || method.type }} · {{ method.type }} · **** {{ method.last4 || 'linked' }}</small>
    </span>
    <i v-if="active" class="pi pi-check"></i>
  </button>
</template>
