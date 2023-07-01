export const prerender = false;

import { AppRoute } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, locals: { api } }) => {
  const { user } = await parent();
  if (user) {
    throw redirect(302, AppRoute.PHOTOS);
  }

  const { data } = await api.userApi.getUserCount({ admin: true });

  if (data.userCount > 0) {
    // Redirect to login page if an admin is already registered.
    throw redirect(302, AppRoute.AUTH_LOGIN);
  }

  return {
    meta: {
      title: 'Welcome 🎉',
      description: 'Immich Web Interface',
    },
  };
}) satisfies PageServerLoad;
