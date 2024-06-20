import { AppRoute } from '$lib/constants';
import { getServerConfig } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load = (async () => {
  const { isInitialized } = await getServerConfig();
  if (isInitialized) {
    // Admin has been registered, redirect to login
    redirect(302, AppRoute.AUTH_LOGIN);
  }

  const $t = get(t);

  return {
    meta: {
      title: $t('admin.registration'),
    },
  };
}) satisfies PageLoad;
