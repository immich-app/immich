import { AppRoute } from '$lib/constants';
import { user } from '$lib/stores/user.store';
import { authenticate } from '$lib/utils/auth';
import { redirect } from '@sveltejs/kit';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();
  if (!get(user).shouldChangePassword) {
    redirect(302, AppRoute.PHOTOS);
  }

  const $t = get(t);

  return {
    meta: {
      title: $t('change_password'),
    },
  };
}) satisfies PageLoad;
