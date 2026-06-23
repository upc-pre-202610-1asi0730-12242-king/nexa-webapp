import { useAuthStore } from '@/iam/application/iam.store';

export function capabilityGuard(to) {
  const auth = useAuthStore();
  const capabilityRecord = to.matched.find(record => record.meta.capability);
  const requiredCapability = capabilityRecord?.meta.capability;

  if (!requiredCapability) return true;
  if (auth.permissions.includes('*')) return true;
  if (auth.tenant?.capabilities?.includes(requiredCapability)) return true;

  return {
    name: 'auth.forbidden',
    query: { from: to.fullPath, required: requiredCapability },
  };
}

