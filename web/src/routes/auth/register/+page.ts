import { AppRoute } from '$lib/constants';
import { serverConfig } from '$lib/stores/server-config.store';
import { getFormatter } from '$lib/utils/i18n';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load = (async ({ parent }) => {
  await parent();
  const { isInitialized } = get(serverConfig);
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
