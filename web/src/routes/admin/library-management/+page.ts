import { authenticate, requestServerInfo } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { searchUsersAdmin } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate({ admin: true });
  await requestServerInfo();
  const allUsers = await searchUsersAdmin({ withDeleted: false });
  const $t = await getFormatter();

  return {
    allUsers,
    meta: {
      title: $t('admin.external_library_management'),
    },
  };
}) satisfies PageLoad;
