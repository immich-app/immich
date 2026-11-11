import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { Route } from '#lib/route.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
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
