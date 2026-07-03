<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { iamApplication } from '@/iam/application/iam.application';
import { useAuthStore } from '@/iam/application/iam.store';
import WorkspaceLoginForm from '@/iam/presentation/components/workspace-login-form.vue';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const tenantPreview = ref(null);
const error = ref('');
const warning = ref('');
const loading = ref(false);
const registrationSuccess = ref(false);
let workspaceLookupId = 0;

const tenantStatus = computed(() => tenantPreview.value?.status || '');

onMounted(() => {
  if (route.query.registration === 'submitted') {
    registrationSuccess.value = true;
    const query = { ...route.query };
    delete query.registration;
    router.replace({ path: route.path, query });
  }
});

async function resolveWorkspace(workspaceSlug) {
  const lookupId = ++workspaceLookupId;
  const slug = workspaceSlug.trim();
  error.value = '';
  warning.value = '';
  tenantPreview.value = null;
  if (!slug) return;

  const tenant = await iamApplication.resolveWorkspace(slug);
  if (lookupId !== workspaceLookupId) return;

  tenantPreview.value = tenant;
  if (tenantPreview.value?.status === 'suspended') {
    warning.value = t('auth.workspaceLogin.suspendedWorkspace');
  }
}

function inspectEmail(email) {
  if (email && iamApplication.isPersonalEmail(email)) {
    warning.value = t('auth.workspaceLogin.personalEmailWarning');
    return;
  }
  warning.value = tenantPreview.value?.status === 'suspended'
    ? t('auth.workspaceLogin.suspendedWorkspace')
    : '';
}

function targetForCurrentSession() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '';
  if (redirect.startsWith('/ops') || redirect.startsWith('/portal')) return redirect;
  if (auth.scope === 'portal') return '/portal/home';
  if (auth.user?.roleKey === 'owner') return '/ops/operations/company-administration';
  return auth.user?.roleKey === 'logistics'
    ? '/ops/operations/dashboard'
    : '/ops/commercial/dashboard';
}

function isCredentialFailure(err) {
  return [400, 401].includes(Number(err?.response?.status));
}

function isApiConnectivityFailure(err) {
  const status = Number(err?.response?.status || 0);
  const contentType = String(err?.response?.headers?.['content-type'] || '');
  return !err?.response ||
    status === 404 ||
    contentType.includes('text/html') ||
    ['ERR_NETWORK', 'ECONNABORTED'].includes(err?.code);
}

function logLoginDiagnostic(err) {
  if (!import.meta.env.DEV) return;
  const config = err?.config || {};
  console.warn('[Nexa Auth] Login request failed', {
    status: err?.response?.status || null,
    code: err?.code || null,
    baseURL: config.baseURL || null,
    url: config.url || null,
    contentType: err?.response?.headers?.['content-type'] || null,
  });
}

async function doLogin({ workspaceSlug, email, password }) {
  error.value = '';
  if (!workspaceSlug || !email || !password) {
    error.value = t('auth.workspaceLogin.missingFields');
    return;
  }
  if (iamApplication.isPersonalEmail(email)) {
    error.value = t('auth.workspaceLogin.personalEmailWarning');
    return;
  }
  if (!tenantPreview.value) tenantPreview.value = await iamApplication.resolveWorkspace(workspaceSlug);
  if (tenantStatus.value === 'suspended') {
    router.push({ name: 'auth.blocked', query: { workspace: tenantPreview.value.slug } });
    return;
  }

  loading.value = true;
  try {
    await auth.login({ workspaceSlug, email, password });
    router.push(targetForCurrentSession());
  } catch (err) {
    if (err.code === 'WORKSPACE_SUSPENDED') {
      router.push({ name: 'auth.blocked', query: { workspace: err.tenant?.slug || workspaceSlug } });
      return;
    }
    logLoginDiagnostic(err);
    error.value = isCredentialFailure(err) && !isApiConnectivityFailure(err)
      ? t('auth.workspaceLogin.invalidCredentials')
      : t('auth.workspaceLogin.apiUnavailable');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-form-title">{{ t('auth.workspaceLogin.title') }}</div>
  <div class="auth-form-sub">{{ t('auth.workspaceLogin.subtitle') }}</div>

  <WorkspaceLoginForm
    :tenant="tenantPreview"
    :error="error"
    :warning="warning"
    :success="registrationSuccess ? t('auth.workspaceLogin.registrationSubmitted') : ''"
    :loading="loading"
    @dismiss-success="registrationSuccess = false"
    @workspace-change="resolveWorkspace"
    @email-change="inspectEmail"
    @submit="doLogin"
  />
</template>

<style scoped>
:global(.auth-page) {
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  padding: 0;
  overflow-x: hidden;
  background:
    radial-gradient(circle at 86% 16%, rgba(37, 99, 235, .10), transparent 28%),
    radial-gradient(circle at 72% 86%, rgba(14, 165, 233, .12), transparent 30%),
    linear-gradient(120deg, #edf6ff 0%, #f8fafc 45%, #ffffff 100%);
}

:global(.auth-wrap) {
  width: 100%;
  max-width: none;
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  grid-template-columns: minmax(0, 50%) minmax(0, 50%);
  border: 0;
  border-radius: 0;
  overflow: hidden;
  background: transparent;
  box-shadow: none;
}

:global(.auth-left) {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  min-width: 0;
  padding: clamp(40px, 5vw, 76px);
  background:
    linear-gradient(rgba(255, 255, 255, .035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, .035) 1px, transparent 1px),
    radial-gradient(circle at 24% 18%, rgba(125, 211, 252, .24), transparent 26%),
    radial-gradient(circle at 78% 74%, rgba(59, 130, 246, .20), transparent 30%),
    linear-gradient(148deg, #082f6f 0%, #1551a8 48%, #063160 100%);
  background-size: 56px 56px, 56px 56px, auto, auto, auto;
}

:global(.auth-left::before) {
  content: "";
  position: absolute;
  width: 44vw;
  height: 44vw;
  max-width: 620px;
  max-height: 620px;
  right: -22%;
  top: 10%;
  border-radius: 50%;
  background: rgba(255, 255, 255, .075);
  filter: blur(20px);
}

:global(.auth-left::after) {
  display: none;
}

:global(.auth-left > *) {
  position: relative;
  z-index: 1;
}

:global(.auth-left-content) {
  width: min(100%, 560px);
  display: flex;
  flex-direction: column;
  transform: translateY(1vh);
}

:global(.auth-logo) {
  position: relative;
  width: 136px;
  height: 42px;
  margin-bottom: clamp(56px, 9vh, 112px);
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  overflow: visible;
}

:global(.auth-logo img) {
  width: 136px;
  height: auto;
  opacity: 0;
}

:global(.auth-logo::after) {
  content: "";
  position: absolute;
  inset: 0;
  width: 136px;
  height: 42px;
  background: url("../../../assets/img/nexa-white.svg") left center / contain no-repeat;
}

:global(.auth-tagline) {
  max-width: 500px;
  margin-top: 0;
  color: #ffffff;
  font-size: clamp(34px, 3.3vw, 42px);
  line-height: 1.13;
  font-weight: 760;
  letter-spacing: 0;
  text-shadow: none;
}

:global(.auth-desc) {
  max-width: 460px;
  color: rgba(239, 246, 255, .76);
  font-size: 15px;
  line-height: 1.65;
  margin-top: 18px;
}

:global(.auth-pills) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  width: min(440px, 100%);
  margin-top: 30px;
}

:global(.auth-pill) {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 13px;
  border: 1px solid rgba(255, 255, 255, .14);
  background: rgba(255, 255, 255, .075);
  box-shadow: none;
  backdrop-filter: none;
  font-size: 12px;
  color: rgba(255, 255, 255, .82);
}

:global(.auth-footer-left) {
  position: absolute;
  left: clamp(40px, 5vw, 76px);
  right: clamp(40px, 5vw, 76px);
  bottom: clamp(28px, 4vw, 46px);
  color: rgba(239, 246, 255, .58);
  font-size: 11px;
}

:global(.auth-right) {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-width: 0;
  width: auto;
  padding: clamp(40px, 6vw, 88px);
  background: linear-gradient(180deg, rgba(255, 255, 255, .88) 0%, rgba(248, 250, 252, .96) 100%);
}

:global(.auth-right::before) {
  display: none;
}

:global(.auth-right > .lang-selector),
:global(.auth-right > .auth-form-title),
:global(.auth-right > .auth-form-sub),
:global(.auth-right > .workspace-login-form) {
  width: min(100%, 420px);
}

:global(.lang-selector) {
  align-self: center;
  justify-content: flex-end;
  margin-bottom: 28px;
}

:global(.lang-opt) {
  border-radius: 999px;
  background: rgba(255, 255, 255, .64);
  border-color: #dbe3ef;
}

:global(.lang-opt.active) {
  background: #eff6ff;
  border-color: #bfdbfe;
}

:global(.auth-form-title) {
  color: #0f172a;
  font-size: clamp(30px, 3vw, 36px);
  line-height: 1.14;
  font-weight: 760;
  letter-spacing: 0;
  margin-bottom: 10px;
}

:global(.auth-form-sub) {
  color: #475569;
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 26px;
}

@media (min-width: 1800px) {
  :global(.auth-left) {
    padding-left: 8vw;
    padding-right: 7vw;
  }

  :global(.auth-footer-left) {
    left: 8vw;
    right: 7vw;
  }
}

@media (max-width: 1280px) {
  :global(.auth-left) {
    padding: 46px;
  }

  :global(.auth-footer-left) {
    left: 46px;
    right: 46px;
  }

  :global(.auth-logo) {
    margin-bottom: 52px;
  }
}

@media (max-width: 1024px) {
  :global(.auth-wrap) {
    grid-template-columns: minmax(0, 46%) minmax(0, 54%);
  }

  :global(.auth-left) {
    padding: 34px;
  }

  :global(.auth-left-content) {
    transform: none;
  }

  :global(.auth-footer-left) {
    left: 34px;
    right: 34px;
  }

  :global(.auth-logo) {
    width: 116px;
    margin-bottom: 46px;
  }

  :global(.auth-logo::after) {
    width: 116px;
    height: 36px;
  }

  :global(.auth-tagline) {
    font-size: 32px;
  }

  :global(.auth-pills) {
    grid-template-columns: 1fr;
  }

  :global(.auth-right) {
    padding: 36px;
  }
}

@media (max-width: 820px) {
  :global(.auth-wrap) {
    grid-template-columns: 1fr;
  }

  :global(.auth-left) {
    min-height: auto;
    padding: 28px 28px 30px;
    align-items: flex-start;
  }

  :global(.auth-right::before) {
    display: none;
  }

  :global(.auth-logo) {
    width: 112px;
    height: 34px;
    margin-bottom: 22px;
  }

  :global(.auth-logo::after) {
    width: 112px;
    height: 34px;
  }

  :global(.auth-tagline) {
    max-width: 560px;
    font-size: 30px;
  }

  :global(.auth-desc) {
    max-width: 560px;
  }

  :global(.auth-pills),
  :global(.auth-footer-left) {
    display: none;
  }

  :global(.auth-right) {
    min-height: auto;
    padding: 34px 24px 44px;
  }

  :global(.auth-right > .lang-selector),
  :global(.auth-right > .auth-form-title),
  :global(.auth-right > .auth-form-sub),
  :global(.auth-right > .workspace-login-form) {
    width: min(100%, 440px);
  }
}

@media (max-width: 520px) {
  :global(.auth-left) {
    padding: 24px 20px 26px;
  }

  :global(.auth-tagline) {
    font-size: 25px;
  }

  :global(.auth-desc) {
    font-size: 14px;
    line-height: 1.55;
  }

  :global(.auth-right) {
    padding: 28px 20px 38px;
    align-items: stretch;
  }

  :global(.lang-selector) {
    margin-bottom: 24px;
  }

  :global(.auth-form-title) {
    font-size: 28px;
  }

  :global(.auth-form-sub) {
    font-size: 14px;
  }
}
</style>
