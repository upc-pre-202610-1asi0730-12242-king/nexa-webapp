<script setup>
defineProps({ url: { type: String, required: true }, availability: { type: Object, required: true } });
</script>

<template>
  <div class="slug-preview" :class="{ ok: availability.available }">
    <div>
      <span>{{ $t('tenant.registration.fields.workspaceUrl') }}</span>
      <strong>{{ url }}</strong>
    </div>
    <em>{{ availability.available ? $t('tenant.registration.slugAvailable') : $t('tenant.registration.slugUnavailable') }}</em>
    <small v-if="availability.suggestions?.length">
      {{ $t('tenant.registration.suggestions') }}: {{ availability.suggestions.join(', ') }}
    </small>
  </div>
</template>

<style scoped>
.slug-preview { display:grid; gap:6px; padding:12px; border:1px solid #fde68a; border-radius:12px; background:#fffbeb; color:#92400e; }
.slug-preview.ok { border-color:#bbf7d0; background:#f0fdf4; color:#166534; }
span { display:block; font-size:11px; color:#64748b; margin-bottom:3px; }
strong { color:#0f172a; overflow-wrap:anywhere; }
em, small { font-size:12px; font-style:normal; }
</style>
