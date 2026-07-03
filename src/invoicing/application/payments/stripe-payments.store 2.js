import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { stripePaymentsApi } from '@/invoicing/infrastructure/payments/stripe-payments-api';

export const useStripePaymentsStore = defineStore('stripePayments', () => {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
  const loading = ref(false);
  const error = ref('');
  const lastCheckoutSession = ref(null);
  const lastPaymentIntent = ref(null);

  const frontendConfigured = computed(() => Boolean(publishableKey));

  async function createCheckoutSession(payload) {
    loading.value = true;
    error.value = '';
    try {
      const session = await stripePaymentsApi.createCheckoutSession(payload);
      lastCheckoutSession.value = session;

      if (session?.checkoutUrl) {
        window.location.assign(session.checkoutUrl);
        return session;
      }

      error.value = session?.message || 'Stripe Checkout is not ready. No payment was created.';
      return session;
    } catch (requestError) {
      error.value = requestError?.response?.data?.message
        || requestError?.response?.data?.title
        || requestError?.message
        || 'Stripe Checkout could not be prepared.';
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function createPaymentIntent(payload) {
    loading.value = true;
    error.value = '';
    try {
      const intent = await stripePaymentsApi.createPaymentIntent(payload);
      lastPaymentIntent.value = intent;
      if (!intent?.clientSecret) {
        error.value = intent?.message || 'Stripe PaymentIntent is not ready. No payment was created.';
      }
      return intent;
    } catch (requestError) {
      error.value = requestError?.response?.data?.message
        || requestError?.response?.data?.title
        || requestError?.message
        || 'Stripe PaymentIntent could not be prepared.';
      return null;
    } finally {
      loading.value = false;
    }
  }

  return {
    publishableKey,
    loading,
    error,
    lastCheckoutSession,
    lastPaymentIntent,
    frontendConfigured,
    createCheckoutSession,
    createPaymentIntent,
  };
});
