# Frontend Store Architecture

## Current Direction

`src/app/application/stores/data.store.js` remains as a compatibility facade. It still supports existing Buyer, Sales, Logistics, Invoicing, Warehouse, and Owner screens while the app migrates to bounded-context stores.

Existing context stores include:

- Catalog: `src/catalog-management/application/product-catalog/product-catalog.store.js`
- Sales orders: `src/sales/application/purchase-orders/purchase-orders.store.js`
- Purchase requests: `src/sales/application/purchase-requests/purchase-requests.store.js`
- Clients: `src/sales/application/clients/clients.store.js`
- Warehouse: `src/warehouse/application/inventory-control/inventory-control.store.js`
- Logistics dispatch: `src/logistics/application/dispatch-orders/dispatch-orders.store.js`
- Invoicing documents: `src/invoicing/application/business-documents/business-documents.store.js`
- Tenant/admin: `src/tenant-management/application/company-administration.store.js`

## Implemented Hardening

- Global facade now exposes `collectionErrors` by collection key.
- Failed API loads still set `loadError`, but also preserve per-resource error status/message/timestamp.
- Added client methods for backend read-model endpoints without forcing screens to migrate before the backend contracts exist.
- Context stores now load role-focused read models with explicit loading/error state.
- Buyer home/profile preparation, Buyer order detail lifecycle, Sales order summaries, Sales purchase request inbox, Logistics dispatch detail, and Catalog item availability consume read-model endpoints while keeping the legacy `data.store.js` joins as fallback.
- Active clients now use canonical `/client-accounts`, `/notifications`, `/tenants?slug=`, and `/workspaces?slug=` contracts. No active Vue client calls `/clients`, `/notification-records`, or `/by-*` routes.
- Owner workspace rendering no longer crashes on partially hydrated tenant state; workspace component initialization order is fixed and create/edit/duplicate/reload flows have browser proof.

## Migration Rules

- Do not delete `data.store.js` in one step.
- Move read state by bounded context first.
- Keep mutation flows stable until backend read models and E2E smoke are green.
- Avoid browser-only persistence or mock fallbacks.
- Do not mask API failures as truthful empty business states.

## Read-Model Client Methods

Buyer:

- `getDashboardSummary`
- `getOrderLifecycle`
- `getFinancialProfile`

Sales:

- `getOrderSummaries`
- `getSalesInbox`
- `getClientFinancialProfile`

Logistics:

- `getDispatchSummary`
- `getOrderTimeline`

Catalog:

- `getProductAvailability`
- `getPromotionalCatalog`

These methods are additive. Current screens use them incrementally through context stores and keep old collection-based data as compatibility fallback during the migration.

`data.store.js` remains 1482 lines. This final pass did not risk a broad store rewrite; bounded-context stores are the preferred direction, while compatibility consumers remain explicit debt.
