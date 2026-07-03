<script setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
</script>

<template>
  <div class="auth-form-title">{{ t('auth.blocked') }}</div>
  <div class="auth-form-sub">{{ t('auth.blockedDesc') }}</div>
  <div class="state-warn">
    <i class="pi pi-exclamation-triangle" style="flex-shrink:0;margin-top:1px"></i>
    <div><strong>{{ t('auth.blockedState.pendingTitle') }}</strong><br>
      {{ t('auth.blockedState.pendingDesc') }}
    </div>
  </div>
  <div class="state-alert">
    <i class="pi pi-ban" style="flex-shrink:0;margin-top:1px"></i>
    <div><strong>{{ t('auth.blockedState.blockedTitle') }}</strong><br>
      {{ t('auth.blockedState.blockedDesc') }}
    </div>
  </div>
  <router-link to="/auth/login" class="btn-full btn-ghost-full" style="text-decoration:none">
    <i class="pi pi-arrow-left"></i> {{ t('auth.back') }}
  </router-link>
</template>
