import axios from 'axios';

export const NEXA_API_BASE_URL = import.meta.env.VITE_NEXA_API_BASE_URL || 'http://localhost:5068/api/v1';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || NEXA_API_BASE_URL;
export const CORE_BACKEND_ENABLED = import.meta.env.VITE_CORE_BACKEND_ENABLED !== 'false';

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export const coreHttp = axios.create({
  baseURL: NEXA_API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

const attachBearerToken = (config) => {
  const path = String(config.url || '');
  const isPublicWorkspaceLookup = path.endsWith('/tenants') && Boolean(config.params?.slug);
  const isPublicAuthentication = path.includes('/authentication/sign-in') || path.endsWith('/authentication');
  const isPublicOrganizationRegistration = path.includes('/organization-registrations');
  if (isPublicWorkspaceLookup || isPublicAuthentication || isPublicOrganizationRegistration) return config;

  const token = localStorage.getItem('nexa.token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const tenant = JSON.parse(localStorage.getItem('nexa.tenant') || 'null');
  const membership = JSON.parse(localStorage.getItem('nexa.membership') || 'null');
  if (tenant?.id || membership?.tenantId) config.headers['X-Nexa-Tenant-Id'] = membership?.tenantId || tenant.id;
  if (tenant?.slug) config.headers['X-Nexa-Workspace'] = tenant.slug;
  return config;
};

http.interceptors.request.use(attachBearerToken);
coreHttp.interceptors.request.use(attachBearerToken);

const parseProblemDetails = (err) => {
  const data = err.response?.data;
  if (!data || typeof data !== 'object') return err.message || 'common.dataLoadError';
  return data.detail || data.title || data.message || err.message || 'common.dataLoadError';
};

const isPublicBrowserPath = () => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/auth/')
    || window.location.pathname.startsWith('/tenant-management/register-organization')
    || window.location.pathname.startsWith('/tenant-management/registration-pending/');
};

const handleUnauthorized = (err) => {
  err.nexaMessage = parseProblemDetails(err);
  if (err.response?.status === 401 && typeof window !== 'undefined' && !isPublicBrowserPath()) {
    localStorage.removeItem('nexa.user');
    localStorage.removeItem('nexa.token');
    localStorage.removeItem('nexa.scope');
    localStorage.removeItem('nexa.tenant');
    localStorage.removeItem('nexa.membership');
    if (window.location.pathname !== '/auth/login') {
      window.location.assign('/auth/login');
    }
  }
  if (err.response?.status === 403 && typeof window !== 'undefined' && !isPublicBrowserPath()) {
    const target = '/auth/forbidden';
    if (window.location.pathname !== target) {
      window.location.assign(target);
    }
  }
  return Promise.reject(err);
};

http.interceptors.response.use(
  (res) => res,
  handleUnauthorized
);

coreHttp.interceptors.response.use((res) => res, handleUnauthorized);

export default http;
