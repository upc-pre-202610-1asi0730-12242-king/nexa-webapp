<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useDataStore } from '@/app/application/stores/data.store';
import { useAuthStore } from '@/iam/application/iam.store';
import i18n from '@/i18n';
import logo from '@/assets/img/nexa.svg';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const ds = useDataStore();
const auth = useAuthStore();
const mobileMenuOpen = ref(false);
const notificationsOpen = ref(false);
const browserNotificationStatus = ref(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);

const roleKey = computed(() => auth.user?.roleKey || 'commercial');
const dashboardTo = computed(() => (
  roleKey.value === 'owner'
    ? '/ops/operations/company-administration'
    : roleKey.value === 'logistics'
      ? '/ops/operations/dashboard'
      : '/ops/commercial/dashboard'
));

const companyLegalName = computed(() => auth.tenant?.name || ds.D.company.legalName || t('nav.workspace'));
const workspaceSlug = computed(() => auth.tenant?.slug || '');
const workspaceUrl = computed(() => auth.tenant?.workspaceUrl || `${workspaceSlug.value}.nexa.com.pe`);
const companyDisplayName = computed(() => auth.tenant?.branding?.displayName || ds.D.company.name || t('nav.workspace'));
const companyInitials = computed(() => (companyDisplayName.value || 'IC').slice(0, 2).toUpperCase());

const roleTranslationKey = computed(() => `tenant.companyAdmin.roles.${auth.membership?.role || auth.user?.roleName || 'Viewer'}`);
const roleLabel = computed(() => {
  const translated = t(roleTranslationKey.value);
  return translated === roleTranslationKey.value ? (auth.user?.roleName || ds.D.user.role || 'Operator') : translated;
});
const visibleNotifications = computed(() => ds.D.notifications.slice(0, 6));
const unreadNotifications = computed(() => ds.D.notifications.filter(item => !item.read).length);

const canManageCompany = computed(() => {
  if (auth.permissions.includes('*')) return true;
  return roleKey.value === 'owner' && auth.tenant?.capabilities?.includes('workspace-operations-setup');
});

const companyAdminBase = '/ops/operations/company-administration';
const companyTo = (section) => `${companyAdminBase}?section=${section}`;

const navAll = computed(() => [
  {
    key: 'workspace-dashboard',
    to: dashboardTo.value,
    icon: 'pi-th-large',
    label: t(roleKey.value === 'logistics' ? 'nav.operationsDashboard' : 'nav.commercialDashboard'),
    section: 'workspace',
    roles: ['commercial', 'logistics'],
  },
  {
    key: 'inventory',
    to: '/ops/operations/inventory-control',
    icon: 'pi-database',
    label: t('nav.inventory'),
    section: 'workspace',
    roles: ['logistics'],
  },
  {
    key: 'dispatch-orders',
    to: '/ops/operations/dispatch-orders',
    icon: 'pi-send',
    label: t('nav.dispatchBoard'),
    section: 'workspace',
    roles: ['logistics'],
    badge: () => ds.D.dispatchOrders.filter(d => d.status !== 'delivered').length,
  },
  {
    key: 'pod',
    to: '/ops/operations/proof-of-delivery',
    icon: 'pi-camera',
    label: t('nav.evidence'),
    section: 'workspace',
    roles: ['logistics'],
  },
  {
    key: 'analytics',
    to: '/ops/operations/operational-analytics',
    icon: 'pi-chart-line',
    label: t('nav.operationalAnalytics'),
    section: 'workspace',
    roles: ['logistics'],
  },
  {
    key: 'catalog',
    to: '/ops/product-catalog',
    icon: 'pi-box',
    label: t('nav.catalog'),
    section: 'workspace',
    roles: ['commercial'],
  },
  {
    key: 'purchase-requests',
    to: '/ops/commercial/purchase-requests',
    icon: 'pi-inbox',
    label: t('nav.requests'),
    section: 'commercial',
    roles: ['commercial'],
    badge: () => ds.D.purchaseRequests.filter(r => ['submitted', 'in_review', 'needs_adjustment'].includes(r.status)).length,
  },
  {
    key: 'purchase-orders',
    to: '/ops/commercial/purchase-orders',
    icon: 'pi-file-edit',
    label: t('nav.orders'),
    section: 'commercial',
    roles: ['commercial'],
    badge: () => ds.D.purchaseOrders.filter(o => ['pending', 'validating', 'blocked', 'document_pending'].includes(o.status)).length,
  },
  {
    key: 'manual-order',
    to: '/ops/commercial/manual-order-entry',
    icon: 'pi-plus-circle',
    label: t('nav.createOrder'),
    section: 'commercial',
    roles: ['commercial'],
  },
  {
    key: 'clients',
    to: '/ops/commercial/client-accounts',
    icon: 'pi-users',
    label: t('nav.clients'),
    section: 'commercial',
    roles: ['commercial'],
  },
  {
    key: 'documents',
    to: roleKey.value === 'logistics' ? '/ops/operations/business-documents' : '/ops/commercial/business-documents',
    icon: 'pi-file-check',
    label: t('nav.documents'),
    section: roleKey.value === 'logistics' ? 'workspace' : 'commercial',
    roles: ['commercial', 'logistics'],
    badge: () => ds.D.businessDocuments.filter(d => d.required && ['pending', 'observed', 'rejected'].includes(d.status)).length,
  },
  {
    key: 'promotions',
    to: '/ops/commercial/promotions',
    icon: 'pi-megaphone',
    label: t('nav.promotions'),
    section: 'company',
    roles: ['owner'],
  },
  {
    key: 'company-overview',
    to: companyTo('overview'),
    icon: 'pi-building',
    label: t('tenant.companyAdmin.sections.overview'),
    section: 'company',
    roles: ['owner'],
    requiresCompanyAccess: true,
  },
  {
    key: 'company-workspaces',
    to: companyTo('workspaces'),
    icon: 'pi-sitemap',
    label: t('tenant.companyAdmin.sections.workspaces'),
    section: 'company',
    roles: ['owner'],
    requiresCompanyAccess: true,
  },
  {
    key: 'company-teammates',
    to: companyTo('teammates'),
    icon: 'pi-users',
    label: t('tenant.companyAdmin.sections.teammates'),
    section: 'company',
    roles: ['owner'],
    requiresCompanyAccess: true,
  },
  {
    key: 'company-rules',
    to: companyTo('rules'),
    icon: 'pi-shield',
    label: t('tenant.companyAdmin.sections.rules'),
    section: 'company',
    roles: ['owner'],
    requiresCompanyAccess: true,
  },
  {
    key: 'company-fields',
    to: companyTo('custom-fields'),
    icon: 'pi-list-check',
    label: t('tenant.companyAdmin.sections.customFields'),
    section: 'company',
    roles: ['owner'],
    requiresCompanyAccess: true,
  },
  {
    key: 'company-billing',
    to: companyTo('billing'),
    icon: 'pi-credit-card',
    label: t('tenant.companyAdmin.sections.billing'),
    section: 'company',
    roles: ['owner'],
    requiresCompanyAccess: true,
  },
  {
    key: 'company-preferences',
    to: companyTo('preferences'),
    icon: 'pi-cog',
    label: t('tenant.companyAdmin.sections.preferences'),
    section: 'company',
    roles: ['owner'],
    requiresCompanyAccess: true,
  },
  {
    key: 'profile',
    to: '/ops/profile',
    icon: 'pi-user-edit',
    label: t('nav.profile'),
    section: 'account',
    roles: ['commercial', 'logistics', 'owner'],
  },
  {
    key: 'logout',
    action: 'logout',
    icon: 'pi-sign-out',
    label: t('common.logout'),
    section: 'account',
    roles: ['commercial', 'logistics', 'owner'],
    danger: true,
  },
]);

const navMain = computed(() =>
  navAll.value.filter(item => {
    if (!item.roles.includes(roleKey.value)) return false;
    if (item.requiresCompanyAccess && !canManageCompany.value) return false;
    return true;
  })
);

const sections = computed(() => {
  const all = [
    { key: 'workspace', label: t('nav.workspace') },
    { key: 'commercial', label: t('nav.commercial') },
    { key: 'company', label: t('nav.company') },
    { key: 'account', label: t('nav.account') },
  ];
  return all.filter(sec => navMain.value.some(n => n.section === sec.key));
});

const mobileItems = computed(() => {
  if (roleKey.value === 'owner') {
    return [
      { to: companyTo('overview'), icon: 'pi-building', label: t('tenant.companyAdmin.title') },
      { to: '/ops/profile', icon: 'pi-user-edit', label: t('nav.profile') },
    ];
  }
  if (roleKey.value === 'logistics') {
    return [
      { to: dashboardTo.value, icon: 'pi-th-large', label: t('nav.operationsDashboard') },
      { to: '/ops/operations/inventory-control', icon: 'pi-database', label: t('nav.inventory') },
      { to: '/ops/operations/dispatch-orders', icon: 'pi-send', label: t('nav.dispatchBoard') },
      { to: '/ops/operations/proof-of-delivery', icon: 'pi-camera', label: t('nav.evidence') },
      ...(canManageCompany.value ? [{ to: companyTo('overview'), icon: 'pi-building', label: t('nav.company') }] : []),
    ];
  }
  return [
    { to: dashboardTo.value, icon: 'pi-th-large', label: t('nav.commercialDashboard') },
    { to: '/ops/product-catalog', icon: 'pi-box', label: t('nav.catalog') },
    { to: '/ops/commercial/purchase-requests', icon: 'pi-inbox', label: t('nav.requests') },
    { to: '/ops/commercial/purchase-orders', icon: 'pi-file-edit', label: t('nav.orders') },
    { to: '/ops/commercial/client-accounts', icon: 'pi-users', label: t('nav.clients') },
  ];
});

watch(() => route.fullPath, () => {
  notificationsOpen.value = false;
  mobileMenuOpen.value = false;
});

function companySectionFromTo(to = '') {
  const query = String(to).split('?')[1] || '';
  return new URLSearchParams(query).get('section') || 'overview';
}

function isNavActive(item) {
  if (item.action) return false;
  const p = route.path;
  if (item.to?.startsWith(companyAdminBase)) {
    return p === companyAdminBase && String(route.query.section || 'overview') === companySectionFromTo(item.to);
  }
  if (item.to === '/ops/commercial/purchase-orders') {
    return p === '/ops/commercial/purchase-orders' || p.startsWith('/ops/commercial/purchase-orders/');
  }
  if (item.to === '/ops/operations/dispatch-orders') {
    return p === '/ops/operations/dispatch-orders' || p.startsWith('/ops/operations/dispatch-orders/');
  }
  return p === item.to || (item.to !== '/ops/dashboard' && p.startsWith(item.to + '/'));
}

function setLang(l) {
  locale.value = l;
  i18n.global.locale.value = l;
  localStorage.setItem('nexa.lang', l);
  document.documentElement.lang = l === 'es' ? 'es-419' : 'en';
}

function goOps(itemOrTo) {
  mobileMenuOpen.value = false;
  if (typeof itemOrTo === 'object' && itemOrTo.action === 'logout') {
    logout();
    return;
  }
  router.push(typeof itemOrTo === 'string' ? itemOrTo : itemOrTo.to);
}

async function enableBrowserNotifications() {
  if (typeof Notification === 'undefined') {
    browserNotificationStatus.value = 'unsupported';
    return;
  }
  const permission = await Notification.requestPermission();
  browserNotificationStatus.value = permission;
  if (permission === 'granted') {
    const latest = visibleNotifications.value[0];
    new Notification(latest?.title || 'Nexa notifications enabled', {
      body: latest?.body || 'Sales and logistics updates can now appear from your browser.',
    });
  }
}

function logout() {
  auth.logout();
  mobileMenuOpen.value = false;
  router.push('/auth/login');
}
</script>

<template>
  <div id="ops-app" class="ops-shell">
    <nav class="sidebar workspace-sidebar" role="navigation" :aria-label="t('nav.main')">
      <div class="workspace-identity">
        <div class="workspace-brand">
          <img :src="logo" alt="Nexa" />
          <span>{{ t('nav.workspace') }}</span>
        </div>
        <div class="workspace-card">
          <div class="company-mark workspace-mark">{{ companyInitials }}</div>
          <div class="workspace-copy">
            <strong>{{ companyLegalName }}</strong>
            <span>{{ workspaceUrl }}</span>
          </div>
        </div>
        <div class="workspace-role">
          <i class="pi pi-id-card" aria-hidden="true"></i>
          <span>{{ roleLabel }}</span>
        </div>
      </div>

      <div class="sidebar-nav workspace-nav">
        <template v-for="sec in sections" :key="sec.key">
          <div class="nav-section">{{ sec.label }}</div>
          <button
            v-for="item in navMain.filter(n => n.section === sec.key)"
            :key="item.key"
            type="button"
            class="nav-item workspace-nav-item"
            :class="{ active: isNavActive(item), danger: item.danger }"
            :aria-current="isNavActive(item) ? 'page' : undefined"
            @click="goOps(item)"
          >
            <i :class="'pi ' + item.icon" aria-hidden="true"></i>
            <span>{{ item.label }}</span>
            <span v-if="item.badge && item.badge() > 0" class="nav-count" :aria-label="`${item.badge()} ${t('common.pending')}`">{{ item.badge() }}</span>
          </button>
        </template>
      </div>

      <div class="sidebar-footer">
        <button type="button" class="user-chip workspace-user" @click="router.push('/ops/profile')">
          <div class="avatar">{{ auth.user?.initials || 'NX' }}</div>
          <div>
            <div class="user-name">{{ auth.user?.name || ds.D.user.name }}</div>
            <div class="user-role">{{ roleLabel }}</div>
          </div>
        </button>
      </div>
    </nav>

    <div class="main">
      <header class="topbar" role="banner">
        <button
          class="topbar-icon-btn ops-menu-trigger"
          type="button"
          :aria-label="t('portal.nav.more')"
          :aria-expanded="mobileMenuOpen"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <i class="pi pi-bars" aria-hidden="true"></i>
        </button>
        <div class="topbar-company" :aria-label="t('common.companyIdentity')">
          <div class="company-mark">{{ companyInitials }}</div>
          <div class="topbar-company-copy">
            <div class="topbar-company-name">{{ companyLegalName }}</div>
            <div class="topbar-company-meta">{{ workspaceUrl }} · {{ roleLabel }}</div>
          </div>
        </div>
        <div class="topbar-right">
          <div class="lang-group" role="group" :aria-label="t('common.language')">
            <button class="lang-opt" :class="{ active: locale === 'es' }" @click="setLang('es')" :aria-label="t('common.switchToSpanish')" :aria-pressed="locale === 'es'">ES</button>
            <button class="lang-opt" :class="{ active: locale === 'en' }" @click="setLang('en')" :aria-label="t('common.switchToEnglish')" :aria-pressed="locale === 'en'">EN</button>
          </div>
          <div class="notification-shell">
          <button class="topbar-icon-btn" :aria-label="t('common.notifications')" @click="notificationsOpen = !notificationsOpen">
            <i class="pi pi-bell" aria-hidden="true"></i>
            <div v-if="unreadNotifications" class="notif-dot"></div>
          </button>
          <transition name="fade">
            <section v-if="notificationsOpen" class="notification-popover">
              <div class="notification-head">
                <strong>{{ t('common.notifications') }}</strong>
                <span>{{ unreadNotifications }} {{ t('common.pending') }}</span>
              </div>
              <div class="notification-list">
                <article v-for="item in visibleNotifications" :key="item.id" class="notification-item">
                  <strong>{{ item.title || item.type || t('common.nexaUpdate') }}</strong>
                  <span>{{ item.body || item.status || t('common.workspaceNotification') }}</span>
                </article>
                <div v-if="!visibleNotifications.length" class="notification-empty">
                  {{ t('common.noDatabaseNotifications') }}
                </div>
              </div>
              <button
                class="btn btn-secondary notification-enable"
                type="button"
                :disabled="browserNotificationStatus === 'granted' || browserNotificationStatus === 'unsupported'"
                @click="enableBrowserNotifications"
              >
                <i class="pi pi-bell"></i>
                {{ browserNotificationStatus === 'granted' ? t('common.browserNotificationsEnabled') : browserNotificationStatus === 'unsupported' ? t('common.browserNotificationsUnsupported') : t('common.enableBrowserNotifications') }}
              </button>
            </section>
          </transition>
          </div>
        </div>
      </header>

      <main class="page" role="main" :aria-label="t('common.mainContent')">
        <div v-if="ds.loadError" class="banner banner-danger" role="alert">
          {{ t(ds.loadError) }}
        </div>
        <router-view />
      </main>
    </div>

    <transition name="fade">
      <div v-if="mobileMenuOpen" class="ops-mobile-menu-backdrop" @click="mobileMenuOpen = false" aria-hidden="true"></div>
    </transition>

    <nav class="ops-mobile-menu" :class="{ open: mobileMenuOpen }" role="navigation" :aria-label="t('nav.main')">
      <div class="mobile-workspace-card">
        <strong>{{ companyLegalName }}</strong>
        <span>{{ workspaceUrl }} · {{ roleLabel }}</span>
      </div>
      <button
        v-for="item in navMain"
        :key="item.key"
        type="button"
        class="ops-mobile-menu-item"
        :class="{ active: isNavActive(item), 'ops-mobile-menu-item-danger': item.danger }"
        :aria-current="isNavActive(item) ? 'page' : undefined"
        @click="goOps(item)"
      >
        <i :class="'pi ' + item.icon" aria-hidden="true"></i>
        <span>{{ item.label }}</span>
        <span v-if="item.badge && item.badge() > 0" class="nav-count">{{ item.badge() }}</span>
      </button>
    </nav>

    <nav class="mobile-nav" role="navigation" :aria-label="t('common.mobileNav')">
      <div class="mobile-nav-inner">
        <button
          v-for="item in mobileItems"
          :key="item.to"
          class="mobile-nav-item"
          :class="{ active: isNavActive(item) }"
          @click="goOps(item.to)"
          :aria-current="isNavActive(item) ? 'page' : undefined"
        >
          <i :class="'pi ' + item.icon" aria-hidden="true"></i>
          <span>{{ item.label }}</span>
        </button>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.ops-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
  width: 100%;
  flex: 1;
  background: #f6faff;
}

.workspace-sidebar {
  width: 284px;
  min-width: 284px;
  border-right-color: #e2e8f0;
  background: #ffffff;
}

.notification-shell {
  position: relative;
}

.notification-popover {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 90;
  width: min(360px, calc(100vw - 32px));
  border: 1px solid #dbe5f2;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 20px 48px rgba(15, 23, 42, .18);
  overflow: hidden;
}

.notification-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #e8eef7;
}

.notification-head strong {
  color: #0f172a;
  font-size: 13px;
}

.notification-head span {
  color: #64748b;
  font-size: 12px;
}

.notification-list {
  max-height: 280px;
  overflow: auto;
}

.notification-item {
  display: grid;
  gap: 4px;
  padding: 13px 16px;
  border-bottom: 1px solid #eef5fc;
}

.notification-item strong {
  color: #0f172a;
  font-size: 13px;
}

.notification-item span,
.notification-empty {
  color: #64748b;
  font-size: 12px;
  line-height: 1.45;
}

.notification-empty {
  padding: 18px 16px;
}

.notification-enable {
  width: calc(100% - 24px);
  justify-content: center;
  margin: 12px;
}

.workspace-identity {
  display: grid;
  gap: 12px;
  padding: 18px 16px 14px;
  border-bottom: 1px solid #e2e8f0;
}

.workspace-brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.workspace-brand img {
  width: 88px;
  height: auto;
}

.workspace-brand span {
  color: #64748b;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.workspace-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 12px;
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
}

.workspace-mark {
  width: 38px;
  height: 38px;
  border-radius: 12px;
}

.workspace-copy {
  min-width: 0;
}

.workspace-copy strong {
  display: block;
  color: #0f172a;
  font-size: 13px;
  font-weight: 900;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-copy span,
.workspace-role span,
.mobile-workspace-card span {
  color: #64748b;
  font-size: 11px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.workspace-role {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  justify-self: start;
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid #bbf7d0;
  border-radius: 999px;
  background: #f0fdf4;
  color: #15803d;
}

.workspace-role span {
  color: #15803d;
  font-weight: 800;
}

.workspace-nav {
  gap: 2px;
  padding: 12px 10px;
}

.workspace-nav-item {
  min-height: 38px;
  padding: 0 11px;
  border-radius: 10px;
  color: #475569;
}

.workspace-nav-item span:first-of-type {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-nav-item.active {
  background: #eff6ff;
  color: #1d4ed8;
  box-shadow: inset 3px 0 0 #2563eb;
}

.workspace-nav-item.danger {
  color: #991b1b;
}

.workspace-nav-item.danger:hover {
  background: #fef2f2;
  color: #991b1b;
}

.workspace-user {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
}

.lang-group {
  display: flex;
  gap: 2px;
  margin-right: 4px;
}

.lang-group .lang-opt {
  padding: 3px 8px;
  font-size: 11px;
}

.mobile-workspace-card {
  grid-column: 1 / -1;
  display: grid;
  gap: 3px;
  padding: 12px;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  background: #eff6ff;
}

.mobile-workspace-card strong {
  color: #0f172a;
  font-size: 13px;
}

@media (max-width: 980px) {
  .workspace-sidebar {
    width: 264px;
    min-width: 264px;
  }
}

@media (max-width: 700px) {
  .workspace-sidebar {
    display: none;
  }
}
</style>
