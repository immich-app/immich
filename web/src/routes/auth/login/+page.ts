import { AppRoute } from '$lib/constants';
import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
import { getFormatter } from '$lib/utils/i18n';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ parent, url }) => {
  await parent();

  if (!serverConfigManager.value.isInitialized) {
    // Admin not registered
    redirect(307, AppRoute.AUTH_REGISTER);
  }

  const $t = await getFormatter();
  return {
    meta: {
      title: $t('login'),
    },
    continueUrl: url.searchParams.get('continue') || AppRoute.PHOTOS,
  };
}) satisfies PageLoad;
