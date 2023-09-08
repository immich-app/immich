import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
export const prerender = false;

export const load: PageLoad = async ({ parent }) => {
  const { user } = await parent();
  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  }

  throw redirect(302, AppRoute.TRASH);
};
