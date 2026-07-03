# Contributing to Nexa WebApp

## Repository Context

`nexa-webapp` is the Vue workspace for the Nexa TB2 delivery.

| Field | Value |
|---|---|
| Current release | `v3.0.1` |
| Delivery | TB2 |
| Runtime | Vue 3 / Vite |
| State and routing | Pinia / Vue Router |
| Live WebApp | https://nexa-webapp.onrender.com/#/auth/login |
| Platform API | https://nexa-platform-20wt.onrender.com |

## Workflow

1. Create a branch from `develop` unless the maintainer requests a release correction from `main`.
2. Keep changes scoped to one bounded context or one documentation concern.
3. Use conventional commits.
4. Validate locally before opening a pull request.
5. Do not commit local credentials, `.env` files, generated bundles, `node_modules`, or temporary artifacts.

## Branch Names

| Prefix | Use |
|---|---|
| `feature/` | New user-facing workflow |
| `fix/` | Bug fix |
| `docs/` | Documentation update |
| `refactor/` | Internal restructuring without behavior change |
| `chore/` | Configuration, tooling, release maintenance |

## Architecture Rules

- Keep API calls inside infrastructure services.
- Keep shared state inside Pinia stores.
- Keep visible text in i18n locale files.
- Keep presentation components focused on UI and user interaction.
- Preserve route guards and role-based navigation.
- Do not hardcode secrets, passwords, tokens, or production-only values.

## Validation Checklist

Before requesting review:

```bash
npm run build
```

For route or UI work, also verify login, workspace selection, and the affected role-specific flow in a browser.

## Pull Request Notes

Each pull request should include:

- Scope and bounded context.
- User-facing route or view impact.
- API contract dependency, if any.
- Validation commands and results.
- Deployment or environment notes, if any.

---

Team King · UPC · Aplicaciones Web · TB2 · 2026-10
