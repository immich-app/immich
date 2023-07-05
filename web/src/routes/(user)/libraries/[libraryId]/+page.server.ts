import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, locals: { api, user } }) => {
  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  }

  const libraryId = params['libraryId'];

  try {
    const { data: library } = await api.libraryApi.getLibraryInfo({ id: libraryId });
    return {
      library,
      user,
      meta: {
        title: library.name,
      },
    };
  } catch (e) {
    throw redirect(302, AppRoute.LIBRARIES);
  }
}) satisfies PageServerLoad;
