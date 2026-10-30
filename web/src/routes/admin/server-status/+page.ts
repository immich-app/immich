import { queryClient } from '#lib/queries/client.ts';
import { getServerStatisticsQuery } from '#lib/queries/server-info.query.ts';
import { searchUsersAdminQuery } from '#lib/queries/user-admin.query.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
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
