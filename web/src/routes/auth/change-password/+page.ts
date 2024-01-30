import { AppRoute } from '$lib/constants';
import { authenticate } from '$lib/utils/auth';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { currentUser } from '$lib/stores/user.store';

export const load = (async () => {
  await authenticate();
  if (!currentUser().shouldChangePassword) {
    redirect(302, AppRoute.PHOTOS);
  }

  return {
    meta: {
      title: 'Change Password',
    },
  };
}) satisfies PageLoad;
