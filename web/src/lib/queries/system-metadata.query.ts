import { asMutation, queryClient } from '#lib/queries/client.ts';
import { QueryKeys } from '#lib/queries/query-keys.ts';
import { updateAdminOnboarding } from '@immich/sdk';

export const updateAdminOnboardingMutation = () =>
  asMutation(updateAdminOnboarding, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QueryKeys.serverConfig() }),
  });
