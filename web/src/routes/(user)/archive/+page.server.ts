import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals: { user } }) => {
  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  }

  return {
    user,
    meta: {
      title: 'Archive',
    },
  };
}) satisfies PageServerLoad;
