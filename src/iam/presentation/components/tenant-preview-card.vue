<script setup>
defineProps({
  tenant: {
    type: Object,
    default: null,
  },
});
</script>

<template>
  <section v-if="tenant" class="tenant-preview" :class="{ 'tenant-preview--suspended': tenant.status === 'suspended' }">
    <div class="tenant-preview-mark">
      {{ tenant.name?.slice(0, 2).toUpperCase() }}
    </div>
    <div class="tenant-preview-body">
      <div class="tenant-preview-eyebrow">{{ $t('auth.workspacePreview') }}</div>
      <div class="tenant-preview-name">{{ tenant.name }}</div>
      <div class="tenant-preview-meta">
        <span>{{ tenant.workspaceUrl }}</span>
        <span>{{ tenant.plan }}</span>
        <span class="status-badge">{{ $t(`auth.tenantStatus.${tenant.status}`) }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tenant-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #dbeafe;
  background:
    radial-gradient(circle at 96% 12%, rgba(14, 165, 233, .10), transparent 34%),
    rgba(239, 246, 255, .58);
  border-radius: 12px;
  padding: 11px 12px;
  margin-bottom: 16px;
  box-shadow: none;
}
.tenant-preview--suspended {
  border-color: #fde68a;
  background:
    radial-gradient(circle at 96% 12%, rgba(245, 158, 11, .10), transparent 34%),
    rgba(255, 251, 235, .70);
}
.tenant-preview-mark {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: #1d4ed8;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 760;
  font-size: 12px;
  flex-shrink: 0;
  box-shadow: 0 10px 18px rgba(37, 99, 235, .20);
}
.tenant-preview--suspended .tenant-preview-mark {
  background: #b45309;
  box-shadow: 0 12px 22px rgba(180, 83, 9, .18);
}
.tenant-preview-body {
  min-width: 0;
  flex: 1;
}
.tenant-preview-eyebrow {
  color: #475569;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0;
  margin-bottom: 4px;
}
.tenant-preview-name {
  color: #0f172a;
  font-size: 14px;
  font-weight: 720;
  margin-bottom: 6px;
  overflow-wrap: anywhere;
}
.tenant-preview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  color: #475569;
  font-size: 11px;
}
.tenant-preview-meta span {
  background: rgba(255, 255, 255, .78);
  border: 1px solid rgba(148, 163, 184, .34);
  border-radius: 999px;
  padding: 3px 8px;
  font-weight: 650;
  max-width: 100%;
  overflow-wrap: anywhere;
}
.tenant-preview-meta .status-badge {
  color: #166534;
  border-color: rgba(34, 197, 94, .32);
  background: rgba(240, 253, 244, .92);
}
.tenant-preview--suspended .tenant-preview-meta .status-badge {
  color: #92400e;
  border-color: rgba(245, 158, 11, .34);
  background: rgba(255, 251, 235, .92);
}
@media (max-width: 420px) {
  .tenant-preview {
    align-items: flex-start;
  }
}
</style>
