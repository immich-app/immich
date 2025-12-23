import { authenticate, requestServerInfo } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { searchUsersAdmin } from '@immich/sdk';
import type { LayoutLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  await requestServerInfo();
  const users = await searchUsersAdmin({ withDeleted: true });
  const $t = await getFormatter();

  return {
    users,
    meta: {
      title: $t('admin.user_management'),
    },
  };
}) satisfies LayoutLoad;
