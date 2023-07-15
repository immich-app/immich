import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals: { user } }) => {
  if (!user) {
    throw redirect(302, AppRoute.AUTH_LOGIN);
  } else if (!user.shouldChangePassword) {
    throw redirect(302, AppRoute.PHOTOS);
  }

  return {
    user,
    meta: {
      title: 'Change Password',
    },
  };
}) satisfies PageServerLoad;
