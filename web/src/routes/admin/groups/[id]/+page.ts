import { AppRoute } from '$lib/constants';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getUsersForGroupAdmin, searchGroupsAdmin } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url, { admin: true });
  const $t = await getFormatter();

  const [group] = await searchGroupsAdmin({ id: params.id }).catch(() => []);
  if (!group) {
    redirect(302, AppRoute.ADMIN_GROUPS);
  }

  const users = await getUsersForGroupAdmin({ id: params.id });

  return {
    group,
    users,
    meta: {
      title: $t('admin.group_details'),
    },
  };
}) satisfies PageLoad;
