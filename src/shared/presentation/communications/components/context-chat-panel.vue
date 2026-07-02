<script setup>
import { useI18n } from 'vue-i18n';

defineProps({ messages: { type: Array, default: () => [] } });
const { t } = useI18n();
</script>

<template>
  <section class="flow-panel">
    <div class="flow-panel-head">
      <div>
        <h2>{{ t('communications.comments') }}</h2>
        <p>{{ t('communications.contextual') }}</p>
      </div>
    </div>
    <div class="flow-stack">
      <div v-for="message in messages" :key="message.id" class="message-bubble">
        <strong>{{ message.senderName }}</strong>
        <p>{{ message.body }}</p>
      </div>
      <div v-if="!messages.length" class="empty-state">
        <div class="empty-state-title">{{ t('communications.noMessages') }}</div>
      </div>
    </div>
  </section>
</template>
