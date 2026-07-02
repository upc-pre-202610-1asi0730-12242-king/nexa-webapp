<template>
  <div class="page-header">
    <div>
      <div class="page-title">{{ $t('portal.nav.premium') }}</div>
      <div class="page-subtitle">{{ $t('portal.premium.subtitle') }}</div>
    </div>
    <span class="premium-lock"><i class="pi pi-lock"></i> {{ $t('portal.premium.futureCapability') }}</span>
  </div>

  <section class="buyer-shell-band" style="margin-bottom:20px">
    <div style="position:relative;z-index:1">
      <div class="buyer-title">{{ $t('portal.premium.heroTitle') }}</div>
      <div class="buyer-subtitle" style="margin-top:8px">
        {{ $t('portal.premium.heroSubtitle') }}
      </div>
    </div>
  </section>

  <div class="grid-3">
    <article class="buyer-card flow-panel-pad">
      <div class="flow-kpi-icon"><i class="pi pi-star"></i></div>
      <div class="flow-title" style="margin-top:12px">{{ $t('portal.premium.visualCatalog') }}</div>
      <div class="flow-note">{{ $t('portal.premium.visualCatalogDesc') }}</div>
      <span class="premium-lock" style="margin-top:14px"><i class="pi pi-lock"></i> {{ $t('portal.premium.premium') }}</span>
    </article>
    <article class="buyer-card flow-panel-pad">
      <div class="flow-kpi-icon" style="background:#ECFEFF;color:#0891B2"><i class="pi pi-map"></i></div>
      <div class="flow-title" style="margin-top:12px">{{ $t('portal.premium.trackingMap') }}</div>
      <div class="flow-note">{{ $t('portal.premium.trackingMapDesc') }}</div>
      <span class="premium-lock" style="margin-top:14px"><i class="pi pi-lock"></i> {{ $t('portal.premium.futureGps') }}</span>
    </article>
    <article class="buyer-card flow-panel-pad">
      <div class="flow-kpi-icon" style="background:#EEF2FF;color:#4F46E5"><i class="pi pi-wave-pulse"></i></div>
      <div class="flow-title" style="margin-top:12px">{{ $t('portal.premium.temperature') }}</div>
      <div class="flow-note">{{ $t('portal.premium.temperatureDesc') }}</div>
      <span class="premium-lock" style="margin-top:14px"><i class="pi pi-lock"></i> {{ $t('portal.premium.futureIot') }}</span>
    </article>
    <article class="buyer-card flow-panel-pad">
      <div class="flow-kpi-icon" style="background:#FEF3C7;color:#B45309"><i class="pi pi-tag"></i></div>
      <div class="flow-title" style="margin-top:12px">{{ $t('portal.premium.campaigns') }}</div>
      <div class="flow-note">{{ $t('portal.premium.campaignsDesc') }}</div>
      <span class="premium-lock" style="margin-top:14px"><i class="pi pi-lock"></i> {{ $t('portal.premium.premium') }}</span>
    </article>
    <article class="buyer-card flow-panel-pad">
      <div class="flow-kpi-icon" style="background:#F0FDF4;color:#15803D"><i class="pi pi-refresh"></i></div>
      <div class="flow-title" style="margin-top:12px">{{ $t('portal.premium.reorder') }}</div>
      <div class="flow-note">{{ $t('portal.premium.reorderDesc') }}</div>
      <span class="premium-lock" style="margin-top:14px"><i class="pi pi-lock"></i> {{ $t('portal.premium.premium') }}</span>
    </article>
    <article class="buyer-card flow-panel-pad">
      <div class="flow-kpi-icon" style="background:#F8FAFC;color:#334155"><i class="pi pi-comments"></i></div>
      <div class="flow-title" style="margin-top:12px">{{ $t('portal.premium.support') }}</div>
      <div class="flow-note">{{ $t('portal.premium.supportDesc') }}</div>
      <span class="premium-lock" style="margin-top:14px"><i class="pi pi-lock"></i> {{ $t('portal.premium.futureSupport') }}</span>
    </article>
  </div>
</template>
