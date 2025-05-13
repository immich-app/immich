import { AppRoute } from '$lib/constants';
import { authenticate, requestServerInfo } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getUserPreferencesAdmin, getUserStatisticsAdmin, searchUsersAdmin } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  await authenticate({ admin: true });
  await requestServerInfo();
  const [user] = await searchUsersAdmin({ id: params.id, withDeleted: true }).catch(() => []);
  if (!user) {
    redirect(302, AppRoute.ADMIN_USERS);
  }

  const [userPreferences, userStatistics] = await Promise.all([
    getUserPreferencesAdmin({ id: user.id }),
    getUserStatisticsAdmin({ id: user.id }),
  ]);

  const $t = await getFormatter();

  return {
    user,
    userPreferences,
    userStatistics,
    meta: {
      title: $t('admin.user_details'),
    },
  };
}) satisfies PageLoad;
