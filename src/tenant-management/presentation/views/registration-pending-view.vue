<script setup>
import { storeToRefs } from 'pinia';
import { useOrganizationRegistrationStore } from '@/tenant-management/application/organization-registration.store';
import PendingReviewPanel from '@/tenant-management/presentation/components/pending-review-panel.vue';

const store = useOrganizationRegistrationStore();
const { submittedRegistration, workspaceUrl, form } = storeToRefs(store);
</script>

<template>
  <section class="pending-page">
    <PendingReviewPanel
      :registration="submittedRegistration || { id: $route.params.id, companyName: form.company.legalName, workspaceUrl, adminEmail: form.administrator.email }"
    />
  </section>
</template>

<style scoped>
:global(.auth-page), :global(.auth-wrap), :global(.auth-right) { min-height:100vh; min-height:100dvh; }
:global(.auth-page) { padding:0; align-items:stretch; background:#f7fbff; }
:global(.auth-wrap) { display:block; width:100%; max-width:none; border-radius:0; box-shadow:none; background:transparent; }
:global(.auth-left) { display:none; }
:global(.auth-right) { width:100%; align-items:center; justify-content:center; padding:32px; background:transparent; }
.pending-page { width:min(100% - 32px,560px); margin:clamp(40px,14vh,120px) auto; border:1px solid #dbe3ef; border-radius:24px; background:white; padding:28px; box-shadow:0 24px 60px rgba(15,23,42,.10); }
</style>

