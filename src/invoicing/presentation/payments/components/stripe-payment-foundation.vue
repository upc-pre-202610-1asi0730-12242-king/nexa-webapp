<script setup>
import { computed } from 'vue';
import { useStripePaymentsStore } from '@/invoicing/application/payments/stripe-payments.store';

const props = defineProps({
  payment: {
    type: Object,
    default: null,
  },
});

const stripePayments = useStripePaymentsStore();

const payable = computed(() => props.payment || null);
const canPrepareCheckout = computed(() => stripePayments.frontendConfigured && payable.value && !stripePayments.loading);
const amountLabel = computed(() => {
  if (!payable.value) return 'No pending payment selected';
  const amount = Number(payable.value.amount || payable.value.total || 0).toFixed(2);
  return `${payable.value.currency || 'PEN'} ${amount}`;
});

async function prepareCheckout() {
  if (!canPrepareCheckout.value) return;

  await stripePayments.createCheckoutSession({
    paymentId: payable.value.backendId || payable.value.id,
    invoiceId: payable.value.invoiceId || null,
    orderId: payable.value.orderId || null,
    amount: Number(payable.value.amount || payable.value.total || 0),
    currency: payable.value.currency || 'PEN',
    successUrl: `${window.location.origin}/portal/payment-methods?stripe=success`,
    cancelUrl: `${window.location.origin}/portal/payment-methods?stripe=cancelled`,
  });
}
</script>

<template>
  <section class="flow-panel stripe-payment-panel">
    <div class="flow-panel-head">
      <div>
        <div class="flow-title">Stripe payment preparation</div>
        <div class="flow-subtitle">Checkout is prepared only through the backend. No card data is stored in Nexa Webapp.</div>
      </div>
      <span class="badge" :class="stripePayments.frontendConfigured ? 'badge-green' : 'badge-amber'">
        {{ stripePayments.frontendConfigured ? 'Publishable key ready' : 'Missing publishable key' }}
      </span>
    </div>
    <div class="flow-panel-pad stripe-payment-grid">
      <div>
        <div class="flow-eyebrow">Selected payment</div>
        <strong>{{ amountLabel }}</strong>
        <span>{{ payable?.referenceCode || payable?.id || 'Pending payment record required' }}</span>
      </div>
      <div class="stripe-payment-copy">
        <strong>Real payment states only</strong>
        <span>Nexa will not mark a payment as paid until a verified backend Stripe flow and webhook update the payment record.</span>
      </div>
      <button class="btn btn-primary" type="button" :disabled="!canPrepareCheckout" @click="prepareCheckout">
        <i :class="stripePayments.loading ? 'pi pi-spin pi-spinner' : 'pi pi-credit-card'"></i>
        {{ stripePayments.loading ? 'Preparing...' : 'Prepare Stripe Checkout' }}
      </button>
    </div>
    <div v-if="stripePayments.error" class="banner banner-warning" role="status">
      {{ stripePayments.error }}
    </div>
  </section>
</template>

<style scoped>
.stripe-payment-panel {
  margin-bottom: 18px;
}
.stripe-payment-grid {
  display: grid;
  grid-template-columns: minmax(0, .8fr) minmax(260px, 1fr) auto;
  gap: 16px;
  align-items: center;
}
.stripe-payment-grid strong {
  display: block;
  color: #0f172a;
  font-size: 18px;
  margin-top: 6px;
}
.stripe-payment-grid span,
.stripe-payment-copy span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 720;
  margin-top: 4px;
}
.stripe-payment-copy {
  border-left: 3px solid #2563eb;
  padding-left: 14px;
}
@media (max-width: 980px) {
  .stripe-payment-grid {
    grid-template-columns: 1fr;
  }
}
</style>
