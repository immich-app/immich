import { AppRoute } from '$lib/constants';
import { user } from '$lib/stores/user.store';
import { authenticate } from '$lib/utils/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();
  if (!get(user).shouldChangePassword) {
    redirect(302, AppRoute.PHOTOS);
  }

  return {
    meta: {
      title: 'Change Password',
    },
  };
}) satisfies PageLoad;
