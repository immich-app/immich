import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
import { Route } from '$lib/route';
import { authenticate, requestServerInfo } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAllFamilyMembers } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  await requestServerInfo();

  // Redirect if family mode is not enabled
  if (!featureFlagsManager.value.familyMode) {
    redirect(307, Route.users());
  }

  const familyMembers = await getAllFamilyMembers();
  const $t = await getFormatter();

  return {
    familyMembers,
    meta: {
      title: $t('admin.family_member_management'),
    },
  };
}) satisfies LayoutLoad;
