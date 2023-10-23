export const prerender = false;

import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, locals: { api } }) => {
  const { user } = await parent();
  if (user) {
    throw redirect(302, AppRoute.PHOTOS);
  }

  const { data } = await api.serverInfoApi.getServerConfig();

  if (data.isInitialized) {
    // Redirect to login page if there exists an admin account (i.e. server is initialized)
    throw redirect(302, AppRoute.AUTH_LOGIN);
  }

  return {
    meta: {
      title: 'Welcome 🎉',
      description: 'Immich Web Interface',
    },
  };
}) satisfies PageServerLoad;
