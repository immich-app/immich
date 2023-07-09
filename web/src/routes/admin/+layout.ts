import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load = (async ({ parent, route }) => {
  const { user } = await parent();
  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  } else if (!user.isAdmin) {
    throw redirect(302, AppRoute.PHOTOS);
  }

  return { routeId: route.id, user };
}) satisfies LayoutLoad;
