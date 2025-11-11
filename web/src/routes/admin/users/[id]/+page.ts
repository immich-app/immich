import { AppRoute } from '$lib/constants';
import { authenticate, requestServerInfo } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getUserAdmin, getUserPreferencesAdmin, getUserSessionsAdmin, getUserStatisticsAdmin } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url, { admin: true });
  await requestServerInfo();
  const user = await getUserAdmin({ id: params.id }).catch(() => undefined);
  if (!user) {
    redirect(302, AppRoute.ADMIN_USERS);
  }

  const [userPreferences, userStatistics, userSessions] = await Promise.all([
    getUserPreferencesAdmin({ id: user.id }),
    getUserStatisticsAdmin({ id: user.id }),
    getUserSessionsAdmin({ id: user.id }),
  ]);

  const $t = await getFormatter();

  return {
    user,
    userPreferences,
    userStatistics,
    userSessions,
    meta: {
      title: $t('admin.user_details'),
    },
  };
}) satisfies PageLoad;
