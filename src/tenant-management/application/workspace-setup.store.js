import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  SEGMENT_CONNECTIONS,
  tenantApi,
  WORKSPACE_SETUP_CHECKLIST,
} from '@/tenant-management/infrastructure/tenant-api';

export const useWorkspaceSetupStore = defineStore('workspaceSetup', () => {
  const tenantProfile = ref(null);
  const checklist = ref([...WORKSPACE_SETUP_CHECKLIST]);
  const segmentConnections = ref([...SEGMENT_CONNECTIONS]);

  const completedCount = computed(() => checklist.value.filter(item => item.done).length);
  const completionPercent = computed(() =>
    Math.round((completedCount.value / Math.max(checklist.value.length, 1)) * 100)
  );

  async function loadWorkspaceSetup(slug = 'icisa') {
    tenantProfile.value = await tenantApi.getCurrentTenant(slug);
    return tenantProfile.value;
  }

  return {
    tenantProfile,
    checklist,
    segmentConnections,
    completedCount,
    completionPercent,
    loadWorkspaceSetup,
  };
});

