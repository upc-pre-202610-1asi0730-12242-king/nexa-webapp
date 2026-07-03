<script setup>
defineProps({ tenant: { type: Object, required: true } });
</script>

<template>
  <section class="tm-card branding-card">
    <div class="brand-mark">{{ tenant.branding.displayName.slice(0, 2).toUpperCase() }}</div>
    <div>
      <span>{{ $t('tenant.workspace.profile') }}</span>
      <h2>{{ tenant.name }}</h2>
      <p>{{ tenant.workspaceUrl }} · {{ tenant.plan }} · {{ $t(`auth.tenantStatus.${tenant.status}`) }}</p>
    </div>
  </section>
</template>
