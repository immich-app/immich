import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
import { Route } from '$lib/route';
import { authenticate, requestServerInfo } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getFamilyMember } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ url, params }) => {
  await authenticate(url, { admin: true });
  await requestServerInfo();

  // Redirect if family mode is not enabled
  if (!featureFlagsManager.value.familyMode) {
    redirect(307, Route.users());
  }

  const familyMember = await getFamilyMember({ id: params.id });
  const $t = await getFormatter();

  return {
    familyMember,
    meta: {
      title: $t('edit_family_member'),
    },
  };
}) satisfies PageLoad;
