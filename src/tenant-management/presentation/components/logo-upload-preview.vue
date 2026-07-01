<script setup>
defineProps({ preview: { type: String, default: null }, error: { type: String, default: '' } });
const emit = defineEmits(['select']);
</script>

<template>
  <label class="logo-upload" for="tenant-logo">
    <div class="logo-box">
      <img v-if="preview" :src="preview" alt="" />
      <span v-else>{{ $t('tenant.registration.logoPlaceholder') }}</span>
    </div>
    <div>
      <strong>{{ $t('tenant.registration.fields.logo') }}</strong>
      <span>{{ $t('tenant.registration.logoHelp') }}</span>
    </div>
    <input id="tenant-logo" type="file" accept="image/*" @change="emit('select', $event.target.files?.[0] || null)" />
    <small v-if="error">{{ $t(error) }}</small>
  </label>
</template>

<style scoped>
.logo-upload { display:grid; grid-template-columns:74px minmax(0,1fr); align-items:center; gap:14px; min-height:92px; padding:14px; border:1px dashed #bfdbfe; border-radius:14px; background:#f8fbff; cursor:pointer; box-sizing:border-box; }
.logo-box { width:64px; height:64px; display:flex; align-items:center; justify-content:center; border:1px solid #bfdbfe; border-radius:14px; background:#eff6ff; color:#1d4ed8; font-size:11px; font-weight:800; overflow:hidden; }
.logo-box img { width:100%; height:100%; object-fit:cover; }
strong { display:block; color:#1d4ed8; font-size:13px; font-weight:800; margin-bottom:4px; }
span { display:block; color:#64748b; font-size:12px; line-height:1.4; }
input { display:none; }
small { grid-column:1/-1; color:#b91c1c; font-size:12px; }
</style>

