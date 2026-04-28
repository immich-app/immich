import { authManager } from '$lib/managers/auth-manager.svelte';
import { Route } from '$lib/route';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  if (!authManager.user.shouldChangePassword) {
    redirect(307, Route.photos());
  }

  const $t = await getFormatter();

  return {
    meta: {
      title: $t('change_password'),
    },
  };
}) satisfies PageLoad;
