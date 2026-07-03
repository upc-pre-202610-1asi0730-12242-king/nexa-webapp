# Stripe Payment Preparation

Nexa Webapp is prepared for a Vue Stripe-compatible payment flow, but it does not create frontend-only successful payments.

## Frontend environment

Required frontend variable:

- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key only.

Never place Stripe secret keys in the webapp. The frontend does not store full card data and does not mark payments as paid.

## Frontend structure

- `src/invoicing/infrastructure/payments/stripe-payments-api.js`: calls backend Stripe preparation endpoints.
- `src/invoicing/application/payments/stripe-payments.store.js`: coordinates loading, errors and checkout preparation state.
- `src/invoicing/presentation/payments/components/stripe-payment-foundation.vue`: buyer-facing foundation panel.

The buyer payments screen shows real payment states:

- `pending`
- `processing`
- `paid`
- `failed`
- `cancelled`

Legacy backend states are normalized only for display:

- `confirmed` is displayed as `paid`.
- `rejected` is displayed as `failed`.

## Required backend endpoints

The frontend expects real backend-owned payment preparation:

- `POST /api/v1/payments/stripe/checkout-sessions`
- `POST /api/v1/payments/stripe/payment-intents`
- `POST /api/v1/payments/stripe/webhook`

Checkout and PaymentIntent endpoints must create Stripe objects server-side before returning `checkoutUrl` or `clientSecret`. If the backend is not ready, the frontend displays the backend message and keeps the payment state unchanged.

## Backend secrets

Backend-only variables:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

The webhook endpoint must verify the `Stripe-Signature` header before any payment state changes.
