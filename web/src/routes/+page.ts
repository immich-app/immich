import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
import { Route } from '$lib/route';
import { useDashboardAsLanding } from '$lib/stores/preferences.store';
import { getFormatter } from '$lib/utils/i18n';
import { init } from '$lib/utils/server';
import type { PageLoad } from './$types';

export const ssr = false;
export const csr = true;

export const load = (async ({ fetch }) => {
  try {
    await init(fetch);

    if (serverConfigManager.value.maintenanceMode) {
      redirect(307, Route.maintenanceMode());
    }

    await authManager.load();
    if (authManager.authenticated) {
      const useDashboard = get(useDashboardAsLanding);
      redirect(307, useDashboard ? Route.dashboard() : Route.photos());
    }

    if (serverConfigManager.value.isInitialized) {
      // Redirect to login page if there exists an admin account (i.e. server is initialized)
      redirect(307, Route.login());
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (redirectError: any) {
    if (redirectError?.status === 307) {
      throw redirectError;
    }
  }

  const $t = await getFormatter();

  return {
    meta: {
      title: $t('welcome') + ' 🎉',
      description: $t('immich_web_interface'),
    },
  };
}) satisfies PageLoad;
