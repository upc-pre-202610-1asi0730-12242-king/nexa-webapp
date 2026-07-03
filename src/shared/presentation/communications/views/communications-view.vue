<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <div>
    <h1 class="page-title">{{ t('communications.title') }}</h1>
    <p class="page-subtitle">{{ t('communications.subtitle') }}</p>
  </div>
</template>
