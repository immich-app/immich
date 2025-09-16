import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (({ params }) => {
  const photoId = params.photoId;
  return redirect(302, `${AppRoute.PHOTOS}/${photoId}`);
}) satisfies PageLoad;
