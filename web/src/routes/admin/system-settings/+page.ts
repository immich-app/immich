import { queryClient } from '$lib/queries/client';
import { getConfigDefaultsQuery, getConfigQuery } from '$lib/queries/system-config.query';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  await Promise.all([queryClient.query(getConfigQuery()), queryClient.query(getConfigDefaultsQuery())]);
  const $t = await getFormatter();

  return {
    meta: {
      title: $t('admin.system_settings'),
    },
  };
}) satisfies PageLoad;
