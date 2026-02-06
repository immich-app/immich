import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
import { Route } from '$lib/route';
import { loadUser } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ parent, url }) => {
  await parent();

  if (!serverConfigManager.value.isInitialized) {
    // Admin not registered
    redirect(307, Route.register());
  }

  const continueUrl = url.searchParams.get('continue') || Route.photos();

  const authenticated = await loadUser();
  if (authenticated) {
    redirect(307, continueUrl);
  }

  const $t = await getFormatter();
  return {
    meta: {
      title: $t('login'),
    },
    continueUrl,
  };
}) satisfies PageLoad;
