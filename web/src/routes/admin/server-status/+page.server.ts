import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, locals: { api } }) => {
  const { user } = await parent();

  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  } else if (!user.isAdmin) {
    throw redirect(302, AppRoute.PHOTOS);
  }

  const { data: stats } = await api.serverInfoApi.getStats();

  return {
    user,
    stats,
    meta: {
      title: 'Server Stats',
    },
  };
}) satisfies PageServerLoad;
