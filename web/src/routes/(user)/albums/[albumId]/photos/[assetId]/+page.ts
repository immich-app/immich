import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
  const albumId = params.albumId;

  if (albumId) {
    redirect(302, `${AppRoute.ALBUMS}/${albumId}`);
  } else {
    redirect(302, AppRoute.PHOTOS);
  }
};
