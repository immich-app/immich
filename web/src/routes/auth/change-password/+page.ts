import { AppRoute } from '$lib/constants';
import { user } from '$lib/stores/user.store';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();
  if (!get(user).shouldChangePassword) {
    redirect(302, AppRoute.PHOTOS);
  }

  const $t = await getFormatter();

  return {
    meta: {
      title: $t('change_password'),
    },
  };
}) satisfies PageLoad;
