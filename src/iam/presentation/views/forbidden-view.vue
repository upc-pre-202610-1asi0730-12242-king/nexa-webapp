<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/iam/application/iam.store';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();

const homePath = computed(() => auth.scope === 'portal' ? '/portal/home' : '/ops/dashboard');
const requestedScope = computed(() => route.query.required === 'portal' ? 'Portal B2B' : 'Nexa Ops');
</script>

<template>
  <div class="auth-form-title">{{ t('auth.forbidden.title') }}</div>
  <div class="auth-form-sub">{{ t('auth.forbidden.subtitle', { scope: requestedScope }) }}</div>
  <div class="state-alert">
    <i class="pi pi-ban" style="flex-shrink:0;margin-top:1px"></i>
    <div>
      <strong>{{ t('auth.forbidden.permission') }}</strong><br>
      {{ t('auth.forbidden.permissionDesc') }}
    </div>
  </div>
  <button class="btn-full btn-primary-full" @click="router.push(homePath)">
    <i class="pi pi-arrow-right"></i> {{ t('auth.forbidden.workspace') }}
  </button>
  <router-link to="/auth/login" class="btn-full btn-ghost-full" style="text-decoration:none;margin-top:10px">
    <i class="pi pi-arrow-left"></i> {{ t('auth.forbidden.switchAccount') }}
  </router-link>
</template>
