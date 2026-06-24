<script setup>
import { onMounted, ref, watch } from 'vue';
import { referenceDataApi } from '@/shared/infrastructure/reference-data-api';

const props = defineProps({
  modelValue: { type: [String, Number, null], default: '' },
  resource: { type: String, required: true },
  label: { type: String, default: '' },
  placeholder: { type: String, default: 'Select option' },
  valueField: { type: String, default: 'code' },
});

const emit = defineEmits(['update:modelValue']);
const options = ref([]);
const loading = ref(false);
const error = ref('');

async function loadOptions() {
  loading.value = true;
  error.value = '';
  try {
    options.value = await referenceDataApi.get(props.resource);
  } catch (err) {
    error.value = err?.message || 'Reference data unavailable';
  } finally {
    loading.value = false;
  }
}

watch(() => props.resource, loadOptions);
onMounted(loadOptions);
</script>

<template>
  <label class="reference-select">
    <span v-if="label">{{ label }}</span>
    <select
      :value="modelValue"
      :disabled="loading || Boolean(error)"
      @change="emit('update:modelValue', $event.target.value)"
    >
      <option value="">{{ loading ? 'Loading...' : placeholder }}</option>
      <option v-for="option in options" :key="option.id || option.code" :value="option[valueField]">
        {{ option.label }}
      </option>
    </select>
    <small v-if="error">{{ error }}</small>
  </label>
</template>

<style scoped>
.reference-select { display:grid; gap:6px; color:#334155; font-size:13px; font-weight:800; }
.reference-select select { min-height:42px; border:1px solid #d7deea; border-radius:12px; background:#fff; color:#0f172a; padding:0 12px; font-size:13px; }
.reference-select small { color:#b91c1c; font-size:11px; font-weight:700; }
</style>

