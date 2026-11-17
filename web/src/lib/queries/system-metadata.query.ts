import { asMutation, queryClient } from '#lib/queries/client.ts';
import { getServerConfigQuery } from '#lib/queries/server-info.query.ts';
import { updateAdminOnboarding } from '@immich/sdk';

export const updateAdminOnboardingMutation = () =>
  asMutation(updateAdminOnboarding, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getServerConfigQuery().queryKey }),
  });
