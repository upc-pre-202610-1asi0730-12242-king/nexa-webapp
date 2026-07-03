# Nexa WebApp Security Policy

## Supported Version

| Repository | Current Release | Delivery | Security Support |
|---|---:|---|---|
| `nexa-webapp` | `v3.0.1` | TB2 | Active |

Older tags remain available for academic traceability, but security corrections are applied to the latest active release line.

## Scope

Security review for this repository includes:

- Authentication views and protected route guards.
- Workspace and role-based navigation.
- API base URL configuration.
- Token handling in frontend state.
- i18n and user-visible content safety.
- Dependency security for npm packages.
- Render deployment configuration.

## Live Security Surface

| Service | URL |
|---|---|
| WebApp | https://nexa-webapp.onrender.com/#/auth/login |
| Platform API | https://nexa-platform-20wt.onrender.com |
| Swagger UI | https://nexa-platform-20wt.onrender.com/swagger/index.html |

## Reporting a Vulnerability

Do not open a public issue for vulnerabilities. Report privately to the Team King maintainers or through GitHub private vulnerability reporting when available.

Include:

- Affected route, view, file, or configuration.
- Steps to reproduce.
- Expected and actual behavior.
- Browser and environment details.
- Risk level and suggested mitigation, if known.

## Security Requirements

- Do not commit secrets, tokens, `.env` files, local API keys, or generated dependency folders.
- Keep API calls centralized in infrastructure services.
- Keep protected routes behind guards.
- Avoid unsafe HTML rendering unless content is explicitly sanitized.
- Review dependency warnings before release.

---

Team King · UPC · Aplicaciones Web · TB2 · 2026-10
