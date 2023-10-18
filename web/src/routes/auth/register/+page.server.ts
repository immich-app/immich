import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals: { api } }) => {
  const { data } = await api.serverInfoApi.getServerConfig();
  if (data.isInitialized) {
    // Admin has been registered, redirect to login
    throw redirect(302, AppRoute.AUTH_LOGIN);
  }

  return {
    meta: {
      title: 'Admin Registration',
    },
  };
}) satisfies PageServerLoad;
