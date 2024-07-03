import { AppRoute } from '$lib/constants';
import { getFormatter } from '$lib/utils/i18n';
import { getServerConfig } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async () => {
  const { isInitialized } = await getServerConfig();
  if (isInitialized) {
    // Admin has been registered, redirect to login
    redirect(302, AppRoute.AUTH_LOGIN);
  }

  const $t = await getFormatter();

  return {
    meta: {
      title: $t('admin.registration'),
    },
  };
}) satisfies PageLoad;
