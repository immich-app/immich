import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals: { api, user } }) => {
  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  }

  try {
    const { data: albums } = await api.albumApi.getAllAlbums();

    return {
      user: user,
      albums: albums,
      meta: {
        title: 'Albums',
      },
    };
  } catch (e) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  }
}) satisfies PageServerLoad;
