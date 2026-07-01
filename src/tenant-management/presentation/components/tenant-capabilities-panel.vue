<script setup>
defineProps({ capabilities: { type: Array, required: true } });
</script>

<template>
  <section class="tm-card">
    <h3>{{ $t('tenant.workspace.capabilities') }}</h3>
    <div class="cap-list">
      <span v-for="capability in capabilities" :key="capability">{{ $t(`tenant.capabilities.${capability}`) }}</span>
    </div>
  </section>
</template>
