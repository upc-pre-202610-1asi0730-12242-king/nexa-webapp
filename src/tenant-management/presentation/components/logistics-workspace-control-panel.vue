<script setup>
defineProps({ tenant: { type: Object, required: true } });
</script>

<template>
  <section class="tm-card">
    <h3>{{ $t('tenant.workspace.operationalSetup') }}</h3>
    <div class="setup-grid">
      <div><span>{{ $t('tenant.workspace.mainWarehouse') }}</span><strong>{{ tenant.mainWarehouse.name }}</strong></div>
      <div><span>{{ $t('tenant.workspace.coldRooms') }}</span><strong>{{ tenant.mainWarehouse.coldRooms }}</strong></div>
      <div><span>{{ $t('tenant.workspace.temperatureRange') }}</span><strong>{{ tenant.coldChainOperation.temperatureRange }}</strong></div>
      <div><span>{{ $t('tenant.workspace.inventoryLotPolicy') }}</span><strong>{{ tenant.logisticsSetup.inventoryLotPolicy }}</strong></div>
      <div><span>FEFO</span><strong>{{ tenant.logisticsSetup.fefoEnabled ? $t('common.yes') : $t('common.no') }}</strong></div>
      <div><span>{{ $t('tenant.workspace.temperatureAlerts') }}</span><strong>{{ tenant.logisticsSetup.temperatureAlertsEnabled ? $t('common.yes') : $t('common.no') }}</strong></div>
      <div><span>{{ $t('tenant.workspace.dispatchTracking') }}</span><strong>{{ tenant.logisticsSetup.dispatchTrackingEnabled ? $t('common.yes') : $t('common.no') }}</strong></div>
    </div>
  </section>
</template>

