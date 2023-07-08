import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
export const prerender = false;

export const load: PageLoad = async ({ params, parent }) => {
  const { user } = await parent();
  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  }

  const albumId = params['albumId'];

  if (albumId) {
    throw redirect(302, `${AppRoute.ALBUMS}/${albumId}`);
  } else {
    throw redirect(302, AppRoute.PHOTOS);
  }
};
