import { hasAnnualPackageForReels } from './supabaseQueries';

export const annualJobPortalQueryKey = (userId) => ['annualJobPortalAccess', userId];

export function getAnnualJobPortalQueryOptions(userId) {
  return {
    queryKey: annualJobPortalQueryKey(userId),
    queryFn: () => hasAnnualPackageForReels(userId),
    enabled: !!userId,
  };
}
