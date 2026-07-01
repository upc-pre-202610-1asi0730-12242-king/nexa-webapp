<script setup>
defineProps({ checklist: { type: Array, required: true }, completionPercent: { type: Number, required: true } });
</script>

<template>
  <section class="tm-card">
    <div class="section-head">
      <h3>{{ $t('tenant.workspace.onboarding') }}</h3>
      <strong>{{ completionPercent }}%</strong>
    </div>
    <ul class="checklist">
      <li v-for="item in checklist" :key="item.key" :class="{ done: item.done }">
        <i :class="'pi ' + (item.done ? 'pi-check-circle' : 'pi-circle')" aria-hidden="true"></i>
        {{ $t(`tenant.workspace.checklist.${item.key}`) }}
      </li>
    </ul>
  </section>
</template>

