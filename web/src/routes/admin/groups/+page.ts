import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { searchGroupsAdmin } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  const groups = await searchGroupsAdmin({});
  const $t = await getFormatter();

  return {
    groups,
    meta: {
      title: $t('admin.group_management'),
    },
  };
}) satisfies PageLoad;
