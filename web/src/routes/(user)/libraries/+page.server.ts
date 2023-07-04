import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals: { api, user } }) => {
  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  }

  try {
    const { data: libraries } = await api.libraryApi.getAllLibraries();

    return {
      user: user,
      libraries: libraries,
      meta: {
        title: 'Libraries',
      },
    };
  } catch (e) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  }
}) satisfies PageServerLoad;
