import { noop } from 'lodash-es';
import { queryClient } from '$lib/queries/client';
import { getServerStatisticsQuery } from '$lib/queries/server.query';
import { searchUsersAdminQuery } from '$lib/queries/user-admin.query';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
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
