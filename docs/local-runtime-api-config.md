# Nexa Webapp Local Runtime API Config

## Local demo URL

Open the app at:

```text
http://localhost:5173
```

The backend API must be reachable at:

```text
http://localhost:5068/api/v1
```

## Direct API URL mode

Use this when running Vite directly on the host with `npm run dev`:

```env
VITE_NEXA_API_BASE_URL=http://localhost:5068/api/v1
VITE_DEV_PROXY_TARGET=http://localhost:5068
```

In this mode the browser calls the backend directly on port `5068`.

## Vite proxy mode

Use this when `VITE_NEXA_API_BASE_URL` is relative:

```env
VITE_NEXA_API_BASE_URL=/api/v1
```

The Vite dev server proxies `/api/v1/*` to `VITE_DEV_PROXY_TARGET`.

Host machine target:

```env
VITE_DEV_PROXY_TARGET=http://localhost:5068
```

Docker compose webapp container target:

```env
VITE_DEV_PROXY_TARGET=http://api:8080
```

This lets `http://localhost:5173/api/v1/authentication/sign-in` reach the backend service through the Vite proxy instead of returning a frontend `404`.

## Docker compose

The base compose file supports direct backend URL mode:

```env
VITE_NEXA_API_BASE_URL=http://localhost:5068/api/v1
VITE_DEV_PROXY_TARGET=http://api:8080
```

The local override may use proxy mode:

```env
VITE_NEXA_API_BASE_URL=/api/v1
VITE_DEV_PROXY_TARGET=http://api:8080
```

When opening the direct Vite URL `http://localhost:5173`, do not set `VITE_NEXA_API_BASE_URL=/api/v1` unless Vite proxy is enabled.

If using the reverse proxy service, open the proxy URL documented for that run, for example:

```text
http://localhost:8000
```

The proxy must forward `/api/v1` to the backend API.

## Avoiding the login 404

The bad symptom is:

```text
POST http://localhost:5173/api/v1/authentication/sign-in 404
```

That means the frontend is using a relative API base without a working proxy. Fix it by either:

1. setting `VITE_NEXA_API_BASE_URL=http://localhost:5068/api/v1`, or
2. keeping `VITE_NEXA_API_BASE_URL=/api/v1` and setting `VITE_DEV_PROXY_TARGET` correctly.

Invalid credentials should return `400` or `401` from the backend auth endpoint. A `404`, network failure, or HTML response is a runtime API configuration problem, not a password problem.
