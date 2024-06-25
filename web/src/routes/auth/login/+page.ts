import { AppRoute } from '$lib/constants';
import { defaults, getServerConfig } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load = (async ({ fetch }) => {
  defaults.fetch = fetch;
  const { isInitialized } = await getServerConfig();
  if (!isInitialized) {
    // Admin not registered
    redirect(302, AppRoute.AUTH_REGISTER);
  }

  const $t = get(t);
  return {
    meta: {
      title: $t('login'),
    },
  };
}) satisfies PageLoad;
