<script setup>
defineProps({ sections: { type: Array, required: true }, activeSection: { type: String, required: true } });
const emit = defineEmits(['select']);
</script>

<template>
  <nav class="company-admin-sidebar" :aria-label="$t('tenant.companyAdmin.title')">
    <div class="sidebar-label">{{ $t('nav.company') }}</div>
    <button v-for="section in sections" :key="section.key" type="button" :class="{ active: section.key === activeSection }" @click="emit('select', section.key)">
      <i :class="'pi ' + section.icon" aria-hidden="true"></i>
      <span>{{ $t(`tenant.companyAdmin.sections.${section.key}`) }}</span>
    </button>
  </nav>
</template>

<style scoped>
.company-admin-sidebar { position:sticky; top:78px; display:grid; gap:4px; align-content:start; border:1px solid #e2e8f0; border-radius:14px; background:#ffffff; padding:8px; box-shadow:0 8px 18px rgba(15,23,42,.035); }
.sidebar-label { padding:6px 10px 8px; color:#64748b; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.04em; }
button { min-height:38px; display:flex; align-items:center; gap:10px; border:1px solid transparent; border-radius:10px; background:transparent; color:#475569; padding:0 10px; font-size:13px; font-weight:800; text-align:left; cursor:pointer; }
button:hover { background:#f8fafc; color:#0f172a; }
button.active { background:#eff6ff; color:#1d4ed8; border-color:#bfdbfe; }
button i { width:16px; text-align:center; font-size:13px; }
@media (max-width:900px){ .company-admin-sidebar { position:static; grid-template-columns:repeat(2,minmax(0,1fr)); } .sidebar-label { grid-column:1/-1; } }
@media (max-width:560px){ .company-admin-sidebar { grid-template-columns:1fr; } }
</style>
