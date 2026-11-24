import { queryClient } from '#lib/queries/client.ts';
import { getAdminConfigDefaultsQuery, getAdminConfigFieldsQuery } from '#lib/queries/config-admin.query.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  await Promise.all([queryClient.query(getAdminConfigDefaultsQuery()), queryClient.query(getAdminConfigFieldsQuery())]);
  const $t = await getFormatter();

  return {
    meta: {
      title: $t('admin.system_settings'),
    },
  };
}) satisfies PageLoad;
