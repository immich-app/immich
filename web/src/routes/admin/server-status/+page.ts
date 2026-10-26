import { queryClient } from '#lib/queries/client.js';
import { getServerStatisticsQuery } from '#lib/queries/server-info.query.js';
import { searchUsersAdminQuery } from '#lib/queries/user-admin.query.js';
import { authenticate } from '#lib/utils/auth.js';
import { getFormatter } from '#lib/utils/i18n.js';
import { noop } from 'lodash-es';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  void queryClient.query(getServerStatisticsQuery()).catch(noop);
  await queryClient.query(searchUsersAdminQuery());
  const $t = await getFormatter();

  return {
    meta: {
      title: $t('server_stats'),
    },
  };
}) satisfies PageLoad;
