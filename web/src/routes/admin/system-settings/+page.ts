import { queryClient } from '#lib/queries/client.js';
import { getAdminConfigDefaultsQuery } from '#lib/queries/config-admin.query.js';
import { authenticate } from '#lib/utils/auth.js';
import { getFormatter } from '#lib/utils/i18n.js';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  await queryClient.query(getAdminConfigDefaultsQuery());
  const $t = await getFormatter();

  return {
    meta: {
      title: $t('admin.system_settings'),
    },
  };
}) satisfies PageLoad;
