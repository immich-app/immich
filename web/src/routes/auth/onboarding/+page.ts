import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { queryClient } from '#lib/queries/client.ts';
import { getAdminConfigFieldsQuery } from '#lib/queries/config-admin.query.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  if (authManager.user.isAdmin) {
    await queryClient.query(getAdminConfigFieldsQuery());
  }

  const $t = await getFormatter();

  return {
    meta: {
      title: $t('onboarding'),
    },
  };
}) satisfies PageLoad;
