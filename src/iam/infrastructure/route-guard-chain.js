import { authenticationGuard } from '@/iam/infrastructure/authentication.guard';
import { tenantContextGuard } from '@/iam/infrastructure/tenant-context.guard';
import { roleAuthorizationGuard } from '@/iam/infrastructure/role-authorization.guard';
import { capabilityGuard } from '@/iam/infrastructure/capability.guard';

const guards = [
  authenticationGuard,
  tenantContextGuard,
  roleAuthorizationGuard,
  capabilityGuard,
];

export function runRouteGuardChain(to, from) {
  for (const guard of guards) {
    const result = guard(to, from);
    if (result !== true) return result;
  }

  return true;
}

