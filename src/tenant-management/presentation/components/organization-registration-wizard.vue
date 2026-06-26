<script setup>
import { storeToRefs } from 'pinia';
import { useOrganizationRegistrationStore } from '@/tenant-management/application/organization-registration.store';
import RegistrationStepper from './registration-stepper.vue';
import CompanyInformationStep from './company-information-step.vue';
import ColdChainOperationStep from './cold-chain-operation-step.vue';
import MainLocationStep from './main-location-step.vue';
import AdministratorStep from './administrator-step.vue';
import WorkspaceSetupStep from './workspace-setup-step.vue';
import ReviewSubmitStep from './review-submit-step.vue';

const store = useOrganizationRegistrationStore();
const {
  form,
  currentStep,
  errors,
  workspaceUrl,
  slugAvailability,
  emailWarning,
  submitting,
} = storeToRefs(store);

const steps = store.steps;
const registrationOptions = store.REGISTRATION_OPTIONS;
</script>

<template>
  <form class="registration-wizard" @submit.prevent="store.submit">
    <RegistrationStepper :steps="steps" :current-step="currentStep" />

    <CompanyInformationStep v-if="currentStep === 0" :form="form" :errors="errors" :options="registrationOptions" @update="store.update" @logo="store.updateLogo" />
    <ColdChainOperationStep v-else-if="currentStep === 1" :form="form" :errors="errors" :options="registrationOptions" @update="store.update" @category="store.updateCategory" />
    <MainLocationStep v-else-if="currentStep === 2" :form="form" :errors="errors" :options="registrationOptions" @update="store.update" />
    <AdministratorStep v-else-if="currentStep === 3" :form="form" :errors="errors" :warning="emailWarning" :options="registrationOptions" @update="store.update" />
    <WorkspaceSetupStep v-else-if="currentStep === 4" :form="form" :errors="errors" :availability="slugAvailability" :workspace-url="workspaceUrl" :options="registrationOptions" @update="store.update" />
    <ReviewSubmitStep v-else :form="form" :errors="errors" :workspace-url="workspaceUrl" @update="store.update" />

    <div class="wizard-actions">
      <button type="button" class="btn-secondary" :disabled="currentStep === 0 || submitting" @click="store.previousStep">{{ $t('common.back') }}</button>
      <button v-if="currentStep < steps.length - 1" type="button" class="btn-primary" @click="store.nextStep">{{ $t('common.next') }}</button>
      <button v-else type="submit" class="btn-primary" :disabled="submitting">{{ submitting ? $t('common.loading') : $t('tenant.registration.submit') }}</button>
    </div>
  </form>
</template>

<style scoped>
.wizard-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:22px; }
.btn-primary, .btn-secondary { min-height:44px; border-radius:11px; padding:0 18px; font-size:14px; font-weight:720; cursor:pointer; }
.btn-primary { border:0; background:#1d4ed8; color:white; }
.btn-secondary { border:1px solid #d7deea; background:white; color:#334155; }
.btn-secondary:disabled, .btn-primary:disabled { opacity:.55; cursor:not-allowed; }
@media (max-width: 560px) { .wizard-actions { flex-direction:column-reverse; } .btn-primary,.btn-secondary { width:100%; } }
</style>

