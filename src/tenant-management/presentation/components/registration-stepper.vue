<script setup>
defineProps({ steps: { type: Array, required: true }, currentStep: { type: Number, required: true } });
</script>

<template>
  <ol class="tm-stepper">
    <li v-for="(step, index) in steps" :key="step" :class="{ active: index === currentStep, done: index < currentStep }">
      <span>{{ index < currentStep ? '✓' : index + 1 }}</span>
      <strong>{{ $t(`tenant.registration.steps.${step}`) }}</strong>
    </li>
  </ol>
</template>

<style scoped>
.tm-stepper { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:10px; margin:0 0 24px; padding:0; list-style:none; }
.tm-stepper li { min-width:0; color:#64748b; font-size:11px; font-weight:800; text-align:center; }
.tm-stepper span { width:30px; height:30px; display:flex; align-items:center; justify-content:center; border-radius:999px; background:#e2e8f0; margin:0 auto 7px; }
.tm-stepper strong { display:block; white-space:normal; line-height:1.15; font-weight:800; }
.tm-stepper li.active { color:#1d4ed8; }
.tm-stepper li.active span { background:#1d4ed8; color:white; box-shadow:0 0 0 4px #dbeafe; }
.tm-stepper li.done span { background:#16a34a; color:white; }
@media (max-width: 760px) { .tm-stepper { grid-template-columns:repeat(3,minmax(0,1fr)); } }
</style>

