<script setup>
import { computed, ref, watch } from 'vue';
import TenantPreviewCard from './tenant-preview-card.vue';

const props = defineProps({
  tenant: {
    type: Object,
    default: null,
  },
  error: {
    type: String,
    default: '',
  },
  warning: {
    type: String,
    default: '',
  },
  success: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['submit', 'workspace-change', 'email-change', 'dismiss-success']);

const workspaceSlug = ref('');
const email = ref('');
const password = ref('');
const showPassword = ref(false);

const hasError = computed(() => Boolean(props.error));

watch(workspaceSlug, (value) => emit('workspace-change', value));
watch(email, (value) => emit('email-change', value));

function submit() {
  emit('submit', {
    workspaceSlug: workspaceSlug.value,
    email: email.value,
    password: password.value,
  });
}
</script>

<template>
  <form class="workspace-login-form" @submit.prevent="submit">
    <TenantPreviewCard :tenant="tenant" />

    <div v-if="success" class="state-success">
      <i class="pi pi-check-circle" aria-hidden="true"></i>
      <div>{{ success }}</div>
      <button type="button" :aria-label="$t('common.close')" @click="emit('dismiss-success')">
        <i class="pi pi-times" aria-hidden="true"></i>
      </button>
    </div>

    <div v-if="error" class="state-alert">
      <i class="pi pi-times-circle" aria-hidden="true"></i>
      <div>
        <strong>{{ error }}</strong><br>
        {{ $t('auth.workspaceLogin.tryAgain') }}
      </div>
    </div>

    <div v-if="warning && !error" class="state-warn">
      <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
      <div>{{ warning }}</div>
    </div>

    <div class="field workspace-field">
      <label class="workspace-label" for="workspace-slug">{{ $t('auth.workspaceLogin.workspaceLabel') }}</label>
      <div class="field-input" :class="{ error: hasError }">
        <i class="pi pi-building" aria-hidden="true"></i>
        <input
          id="workspace-slug"
          v-model="workspaceSlug"
          type="text"
          inputmode="text"
          autocomplete="organization"
          autocapitalize="none"
          spellcheck="false"
          :placeholder="$t('auth.workspaceLogin.workspacePlaceholder')"
          :disabled="loading"
        />
      </div>
      <div class="workspace-helper">{{ $t('auth.workspaceLogin.workspaceHelper') }}</div>
    </div>

    <div class="field workspace-field">
      <label class="workspace-label" for="corporate-email">{{ $t('auth.workspaceLogin.emailLabel') }}</label>
      <div class="field-input" :class="{ error: hasError }">
        <i class="pi pi-envelope" aria-hidden="true"></i>
        <input
          id="corporate-email"
          v-model="email"
          type="email"
          autocomplete="email"
          autocapitalize="none"
          spellcheck="false"
          :placeholder="$t('auth.workspaceLogin.emailPlaceholder')"
          :disabled="loading"
        />
      </div>
    </div>

    <div class="field workspace-field">
      <label class="workspace-label" for="workspace-password">{{ $t('auth.workspaceLogin.passwordLabel') }}</label>
      <div class="field-input" :class="{ error: hasError }">
        <i class="pi pi-lock" aria-hidden="true"></i>
        <input
          id="workspace-password"
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="current-password"
          placeholder="********"
          :disabled="loading"
        />
        <button
          class="password-toggle"
          type="button"
          :aria-label="$t('auth.workspaceLogin.togglePassword')"
          @click="showPassword = !showPassword"
        >
          <i :class="'pi ' + (showPassword ? 'pi-eye-slash' : 'pi-eye')" aria-hidden="true"></i>
        </button>
      </div>
    </div>

    <div class="workspace-form-links">
      <router-link to="/auth/recover" class="auth-link">{{ $t('auth.forgot') }}</router-link>
    </div>

    <button class="btn-full btn-primary-full" type="submit" :disabled="loading">
      <template v-if="loading">
        <div class="spinner"></div>
        {{ $t('auth.verifying') }}
      </template>
      <template v-else>{{ $t('auth.workspaceLogin.cta') }}</template>
    </button>

    <div class="register-company-cta">
      <span>{{ $t('auth.workspaceLogin.companyAccessPrompt') }}</span>
      <router-link to="/tenant-management/register-organization">{{ $t('auth.workspaceLogin.registerCompany') }}</router-link>
    </div>
  </form>
</template>

<style scoped>
.workspace-login-form {
  display: flex;
  flex-direction: column;
  width: min(100%, 420px);
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
.workspace-field {
  margin-bottom: 16px;
}
.workspace-label {
  display: block;
  font-size: 13px;
  font-weight: 650;
  color: #1e293b;
  margin-bottom: 7px;
}
.workspace-helper {
  color: #64748b;
  font-size: 12px;
  line-height: 1.4;
  margin-top: 7px;
}
.field-input {
  width: 100%;
  height: 48px;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  box-sizing: border-box;
  border: 1px solid #d7deea;
  border-radius: 12px;
  background: rgba(255, 255, 255, .76);
  padding: 0 14px;
  transition: border-color .18s ease, box-shadow .18s ease, background-color .18s ease;
}
.field-input:focus-within {
  border-color: #2563eb;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, .12);
}
.field-input.error {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, .075);
}
.field-input > .pi {
  color: #64748b;
  font-size: 14px;
}
.field-input input {
  width: 100%;
  min-width: 0;
  height: 46px;
  border: 0;
  outline: 0;
  background: transparent;
  color: #0f172a;
  font-size: 14px;
  line-height: 1;
  box-sizing: border-box;
}
.field-input input::placeholder {
  color: #94a3b8;
}
.field-input input:disabled {
  cursor: not-allowed;
}
.workspace-form-links {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin: -2px 0 22px;
}
.auth-link {
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 650;
  text-decoration: none;
}
.auth-link:hover,
.auth-link:focus {
  color: #0f3f91;
  text-decoration: underline;
}
.state-alert,
.state-success,
.state-warn {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
  border-radius: 14px;
  padding: 11px 13px;
  margin: 0 0 16px;
  line-height: 1.45;
  font-size: 13px;
}
.state-alert {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #991b1b;
}
.state-success {
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}
.state-success button {
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #166534;
  cursor: pointer;
}
.state-alert strong {
  color: #7f1d1d;
}
.state-warn {
  border: 1px solid #fde68a;
  background: #fffbeb;
  color: #92400e;
}
.state-alert .pi,
.state-success .pi,
.state-warn .pi {
  margin-top: 2px;
}
.btn-full {
  width: 100%;
  max-width: 100%;
  min-height: 48px;
  box-sizing: border-box;
  border: 0;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 750;
  cursor: pointer;
  transition: transform .16s ease, box-shadow .16s ease, opacity .16s ease;
}
.btn-primary-full {
  color: #ffffff;
  background: #1d4ed8;
  box-shadow: 0 16px 30px rgba(37, 99, 235, .22);
}
.btn-primary-full:hover:not(:disabled),
.btn-primary-full:focus-visible:not(:disabled) {
  transform: translateY(-1px);
  background: #1e40af;
  box-shadow: 0 20px 34px rgba(37, 99, 235, .28);
}
.btn-full:disabled {
  cursor: not-allowed;
  opacity: .64;
  transform: none;
  box-shadow: none;
}
.register-company-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  flex-wrap: wrap;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.45;
}
.register-company-cta a {
  color: #1d4ed8;
  font-weight: 750;
  text-decoration: none;
}
.register-company-cta a:hover,
.register-company-cta a:focus-visible {
  text-decoration: underline;
}
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, .42);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin .8s linear infinite;
}
.password-toggle {
  border: 0;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color .16s ease, color .16s ease;
}
.password-toggle:hover,
.password-toggle:focus-visible {
  background: #eff6ff;
  color: #1d4ed8;
  outline: 0;
}
.password-toggle .pi {
  color: currentColor;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 560px) {
  .workspace-login-form {
    width: 100% !important;
    max-width: 100% !important;
  }
  .workspace-login-form * {
    box-sizing: border-box;
    max-width: 100%;
  }
  .workspace-form-links {
    justify-content: flex-start;
  }
  .btn-full {
    width: 100% !important;
    padding: 0 18px !important;
  }
}
</style>
