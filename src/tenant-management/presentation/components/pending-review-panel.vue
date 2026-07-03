<script setup>
defineProps({ registration: { type: Object, required: true } });
</script>

<template>
  <section class="pending-panel">
    <div class="pending-icon"><i class="pi pi-clock" aria-hidden="true"></i></div>
    <h2>{{ $t('tenant.registration.pending.title') }}</h2>
    <p>{{ $t('tenant.registration.pending.desc') }}</p>
    <div class="pending-meta">
      <span>{{ registration.id }}</span>
      <small v-if="registration.companyName">{{ registration.companyName }}</small>
      <strong>{{ registration.workspaceUrl }}</strong>
      <em>{{ $t('tenant.registration.pending.reviewTime') }}</em>
      <small>{{ $t('tenant.registration.pending.emailCopy', { email: registration.adminEmail }) }}</small>
    </div>
    <div class="pending-steps">
      <span>{{ $t('tenant.registration.pending.stepReview') }}</span>
      <span>{{ $t('tenant.registration.pending.stepActivate') }}</span>
      <span>{{ $t('tenant.registration.pending.stepInvite') }}</span>
    </div>
    <router-link to="/auth/login" class="pending-link">{{ $t('tenant.registration.pending.backToLogin') }}</router-link>
  </section>
</template>

<style scoped>
.pending-panel { display:grid; gap:14px; }
.pending-icon { width:52px; height:52px; display:flex; align-items:center; justify-content:center; border-radius:16px; background:#eff6ff; color:#1d4ed8; }
h2 { margin:0; color:#0f172a; font-size:24px; }
p { margin:0; color:#475569; line-height:1.6; }
.pending-meta { display:grid; gap:6px; padding:14px; border:1px solid #bfdbfe; border-radius:14px; background:#eff6ff; }
.pending-meta span, .pending-meta em, .pending-meta small { color:#475569; font-style:normal; font-size:13px; }
.pending-meta strong { color:#0f172a; }
.pending-steps { display:grid; gap:8px; }
.pending-steps span { padding:10px 12px; border:1px solid #e2e8f0; border-radius:12px; color:#334155; font-size:13px; background:#f8fafc; }
.pending-link { width:fit-content; padding:12px 16px; border-radius:12px; background:#1d4ed8; color:white; font-weight:700; font-size:14px; }
</style>
