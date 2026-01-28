import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
import { Route } from '$lib/route';
import { authenticate, requestServerInfo } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  await requestServerInfo();

  // Redirect if family mode is not enabled
  if (!featureFlagsManager.value.familyMode) {
    redirect(307, Route.users());
  }

  const $t = await getFormatter();

  return {
    meta: {
      title: $t('create_invitation'),
    },
  };
}) satisfies PageLoad;
