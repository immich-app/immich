import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals: { api } }) => {
  const { data } = await api.serverInfoApi.getServerConfig();
  if (!data.isInitialized) {
    // Admin not registered
    throw redirect(302, AppRoute.AUTH_REGISTER);
  }

  return {
    meta: {
      title: 'Login',
    },
  };
}) satisfies PageServerLoad;
