import { redirect } from '@sveltejs/kit';
export const prerender = false;

import { AppRoute } from '$lib/constants';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();

  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  } else {
    throw redirect(302, AppRoute.FAVORITES);
  }
};
