<script setup>
import { storeToRefs } from 'pinia';
import { watch } from 'vue';
import { useRouter } from 'vue-router';
import { useOrganizationRegistrationStore } from '@/tenant-management/application/organization-registration.store';
import OrganizationRegistrationWizard from '@/tenant-management/presentation/components/organization-registration-wizard.vue';

const router = useRouter();
const store = useOrganizationRegistrationStore();
const { submittedRegistration } = storeToRefs(store);

watch(submittedRegistration, (registration) => {
  if (registration) {
    router.push({ name: 'auth.login', query: { registration: 'submitted' } });
  }
});
</script>

<template>
  <section class="tenant-register-page">
    <div class="auth-form-title">{{ $t('tenant.registration.title') }}</div>
    <div class="auth-form-sub">{{ $t('tenant.registration.subtitle') }}</div>
    <div class="tenant-register-note">
      <i class="pi pi-info-circle" aria-hidden="true"></i>
      <span>{{ $t('tenant.registration.note') }}</span>
    </div>
    <div class="tenant-register-panel">
      <OrganizationRegistrationWizard />
    </div>
  </section>
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
  align-items: flex-start;
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

:global(.auth-left > *) {
  position: relative;
  z-index: 1;
}

:global(.auth-left-content) {
  width: min(100%, 560px);
  display: flex;
  flex-direction: column;
  margin-top: clamp(36px, 6vh, 76px);
  transform: none;
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
  padding: 0 13px;
  border: 1px solid rgba(255, 255, 255, .14);
  border-radius: 999px;
  background: rgba(255, 255, 255, .075);
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
  min-width: 0;
  width: auto;
  padding: clamp(34px, 4.6vw, 72px);
  background: linear-gradient(180deg, rgba(255, 255, 255, .88) 0%, rgba(248, 250, 252, .96) 100%);
}

:global(.lang-selector) {
  align-self: center;
  justify-content: flex-end;
  margin-bottom: 24px;
}

:global(.auth-right > .tenant-register-page) { width:min(100%,760px); }
:global(.auth-right) { align-items:center; }
.tenant-register-page { display:grid; gap:16px; width:100%; }
.tenant-register-note { display:flex; gap:10px; align-items:flex-start; padding:12px 14px; border:1px solid #bfdbfe; border-radius:14px; background:#eff6ff; color:#1e3a8a; font-size:13px; line-height:1.45; }
.tenant-register-note i { color:#2563eb; margin-top:2px; }
.tenant-register-panel { border:1px solid #dbe3ef; border-radius:22px; background:rgba(255,255,255,.94); padding:22px; box-shadow:0 24px 60px rgba(15,23,42,.10); }
:deep(.tm-fields) { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
:deep(.tm-field.span-2), :deep(.span-2) { grid-column:1/-1; }
:deep(.tm-field label) { display:block; color:#1e293b; font-size:13px; font-weight:650; margin-bottom:7px; }
:deep(.tm-field input), :deep(.tm-field select) { width:100%; height:46px; border:1px solid #cbd8ea; border-radius:13px; background:linear-gradient(180deg,#ffffff,#f8fbff); color:#0f172a; font-size:14px; padding:0 13px; box-sizing:border-box; box-shadow:inset 0 1px 0 rgba(255,255,255,.9); }
:deep(.tm-field input:focus), :deep(.tm-field select:focus) { outline:0; border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.12); }
:deep(.tm-field small) { display:block; color:#b91c1c; font-size:12px; margin-top:6px; }
:deep(.tm-field small.warn) { color:#92400e; }
:deep(.tm-field small.hint) { color:#64748b; }
:deep(.tm-input-suffix) { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; height:46px; border:1px solid #cbd8ea; border-radius:13px; background:linear-gradient(180deg,#ffffff,#f8fbff); overflow:hidden; }
:deep(.tm-input-suffix:focus-within) { border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.12); }
:deep(.tm-input-suffix input) { border:0; height:42px; box-shadow:none; }
:deep(.tm-input-suffix span) { padding:0 12px; color:#64748b; font-size:13px; font-weight:800; border-left:1px solid #e2e8f0; }
:deep(.tm-check-grid) { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
:deep(.tm-check-card), :deep(.tm-toggle-card) { position:relative; display:flex; align-items:center; gap:10px; min-height:44px; padding:10px 12px; border:1px solid #dbe3ef; border-radius:13px; background:linear-gradient(180deg,#ffffff,#f8fbff); color:#334155; font-size:13px; font-weight:700; cursor:pointer; box-sizing:border-box; }
:deep(.tm-check-card) { overflow:hidden; }
:deep(.tm-check-card input), :deep(.tm-toggle-card input), :deep(.terms input) { position:absolute; opacity:0; pointer-events:none; }
:deep(.tm-check-card::before), :deep(.tm-toggle-card::before), :deep(.terms::before) { content:""; width:18px; height:18px; flex:0 0 18px; border:1px solid #cbd5e1; border-radius:6px; background:#f7fbff; box-sizing:border-box; }
:deep(.tm-check-card.selected), :deep(.tm-toggle-card.selected), :deep(.terms.selected) { border-color:#93c5fd; background:#eff6ff; color:#1d4ed8; }
:deep(.tm-check-card.selected::before), :deep(.tm-toggle-card.selected::before), :deep(.terms.selected::before) { border-color:#1d4ed8; background:#1d4ed8; box-shadow:inset 0 0 0 4px #ffffff; }
:deep(.tm-toggle-grid) { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
@media (max-width: 1024px) {
  :global(.auth-wrap) { grid-template-columns: minmax(0, 44%) minmax(0, 56%); }
  :global(.auth-left) { padding:34px; }
  :global(.auth-logo) { width:116px; margin-bottom:46px; }
  :global(.auth-logo::after) { width:116px; height:36px; }
  :global(.auth-tagline) { font-size:32px; }
  :global(.auth-pills) { grid-template-columns:1fr; }
}
@media (max-width: 820px) {
  :global(.auth-wrap) { grid-template-columns:1fr; }
  :global(.auth-left) { min-height:auto; padding:28px 28px 30px; align-items:flex-start; }
  :global(.auth-logo) { width:112px; height:34px; margin-bottom:22px; }
  :global(.auth-logo::after) { width:112px; height:34px; }
  :global(.auth-tagline) { max-width:560px; font-size:30px; }
  :global(.auth-desc) { max-width:560px; }
  :global(.auth-pills), :global(.auth-footer-left) { display:none; }
  :global(.auth-right) { min-height:auto; padding:34px 24px 44px; }
}
@media (max-width: 620px) { :global(.auth-right) { padding:28px 16px 38px; } .tenant-register-panel { padding:16px; border-radius:18px; } :deep(.tm-fields), :deep(.tm-check-grid), :deep(.tm-toggle-grid) { grid-template-columns:1fr; } }
</style>

