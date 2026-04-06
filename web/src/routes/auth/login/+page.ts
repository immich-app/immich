import { authManager } from '$lib/managers/auth-manager.svelte';
import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
import { Route } from '$lib/route';
import { getFormatter } from '$lib/utils/i18n';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ parent, url }) => {
  await parent();

  if (!serverConfigManager.value.isInitialized) {
    // Admin not registered
    redirect(307, Route.register());
  }

  if (authManager.hasSession) {
    await authManager.load();
    if (authManager.authenticated && !serverConfigManager.value.maintenanceMode) {
      redirect(307, url.searchParams.get('continue') || Route.photos());
    }
  }

  const $t = await getFormatter();
  return {
    meta: {
      title: $t('login'),
    },
    continueUrl: url.searchParams.get('continue') || Route.photos(),
  };
}) satisfies PageLoad;
