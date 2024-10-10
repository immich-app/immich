import { authenticate, requestServerInfo } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { searchUsersAdmin, getConfig } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate({ admin: true });
  await requestServerInfo();
  const allUsers = await searchUsersAdmin({ withDeleted: true });
  const { oauth } = await getConfig();
  const $t = await getFormatter();

  return {
    allUsers,
    oauthEnabled: oauth.enabled,
    meta: {
      title: $t('admin.user_management'),
    },
  };
}) satisfies PageLoad;
