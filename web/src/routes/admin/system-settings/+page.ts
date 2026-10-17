import { queryClient } from '$lib/queries/client';
import { getAdminConfigDefaultsQuery, getAdminConfigQuery } from '$lib/queries/config-admin.query';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  await Promise.all([queryClient.query(getAdminConfigQuery()), queryClient.query(getAdminConfigDefaultsQuery())]);
  const $t = await getFormatter();

  return {
    meta: {
      title: $t('admin.system_settings'),
    },
  };
}) satisfies PageLoad;
