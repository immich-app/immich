import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
import { Route } from '$lib/route';
import { getFormatter } from '$lib/utils/i18n';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ parent }) => {
  await parent();
  if (serverConfigManager.value.isInitialized) {
    // Admin has been registered, redirect to login
    redirect(307, Route.login());
  }

  const $t = await getFormatter();

  return {
    meta: {
      title: $t('admin.registration'),
    },
  };
}) satisfies PageLoad;
