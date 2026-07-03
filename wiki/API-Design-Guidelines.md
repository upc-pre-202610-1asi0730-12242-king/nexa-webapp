# API Design Guidelines

The WebApp connects to the backend REST API layer.

## 1. Endpoint Architecture
- All API services inherit from the `BaseEndpoint` or `BaseApi` classes in `src/shared/infrastructure/`.
- Services encapsulate HTTP methods (GET, POST, PUT, DELETE) using a clean, asynchronous Axios client wrapper.
- All requests target the base url defined under `VITE_NEXA_API_BASE_URL` in environment files.

## 2. Runtime Data Ownership
- Core operational features must call Nexa Platform REST endpoints through infrastructure services.
- Mutating actions must persist through backend commands and then refresh or reconcile Pinia state from the returned resource.
- Views must not call Axios directly; they delegate to stores and infrastructure services.

---

<p align="center">
  [Home](Home.md) · [Project Overview](Project-Overview.md) · [Architecture](Frontend-Architecture.md) · [Development Workflow](Branching-and-Commits.md) · [Quality & Security](Quality-and-Security.md)
</p>
