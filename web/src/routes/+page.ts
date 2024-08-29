import { AppRoute } from '$lib/constants';
import { serverConfig } from '$lib/stores/server-config.store';
import { getFormatter } from '$lib/utils/i18n';
import { init } from '$lib/utils/server';

import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { loadUser } from '../lib/utils/auth';
import type { PageLoad } from './$types';

export const ssr = false;
export const csr = true;

export const load = (async ({ fetch }) => {
  try {
    await init(fetch);
    const authenticated = await loadUser();
    if (authenticated) {
      redirect(302, AppRoute.PHOTOS);
    }

    const { isInitialized } = get(serverConfig);
    if (isInitialized) {
      // Redirect to login page if there exists an admin account (i.e. server is initialized)
      redirect(302, AppRoute.AUTH_LOGIN);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (redirectError: any) {
    if (redirectError?.status === 302) {
      throw redirectError;
    }
  }

  const $t = await getFormatter();

  return {
    meta: {
      title: $t('welcome') + ' 🎉',
      description: $t('immich_web_interface'),
    },
  };
}) satisfies PageLoad;
