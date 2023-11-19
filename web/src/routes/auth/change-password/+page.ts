import { AppRoute } from '$lib/constants';
import { authenticate } from '$lib/utils/auth';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async () => {
  const user = await authenticate();
  if (!user.shouldChangePassword) {
    throw redirect(302, AppRoute.PHOTOS);
  }

  return {
    user,
    meta: {
      title: 'Change Password',
    },
  };
}) satisfies PageLoad;
