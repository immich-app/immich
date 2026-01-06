import { AppRoute, UUID_REGEX } from '$lib/constants';
import { authenticate, requestServerInfo } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getUserPreferencesAdmin, getUserSessionsAdmin, getUserStatisticsAdmin, searchUsersAdmin } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url, { admin: true });
  await requestServerInfo();

  if (!UUID_REGEX.test(params.id)) {
    redirect(307, AppRoute.ADMIN_USERS);
  }

  const [user] = await searchUsersAdmin({ id: params.id, withDeleted: true }).catch(() => []);
  if (!user) {
    redirect(307, AppRoute.ADMIN_USERS);
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
}) satisfies LayoutLoad;
