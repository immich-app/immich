import { searchUsersAdmin } from '@immich/sdk';
import { noop } from 'lodash-es';
import { queryClient } from '$lib/queries/client';
import { getServerStatisticsQuery } from '$lib/queries/server.query';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  void queryClient.query(getServerStatisticsQuery()).catch(noop);
  const users = await searchUsersAdmin({ withDeleted: false });
  const $t = await getFormatter();

  return {
    users,
    meta: {
      title: $t('server_stats'),
    },
  };
}) satisfies PageLoad;
