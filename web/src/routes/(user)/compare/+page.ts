import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
import { Route } from '$lib/route';
import { authenticate, requestServerInfo } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAllFamilyMembers } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  await requestServerInfo();

  // Redirect if family mode is not enabled
  if (!featureFlagsManager.value.familyMode) {
    redirect(307, Route.photos());
  }

  const familyMembers = await getAllFamilyMembers();
  const $t = await getFormatter();

  // Parse initial age from URL query params
  const ageMonthsParam = url.searchParams.get('ageMonths');
  const initialAgeMonths = ageMonthsParam ? Number.parseInt(ageMonthsParam, 10) : 24;

  return {
    familyMembers,
    initialAgeMonths,
    meta: {
      title: $t('compare_at_age'),
    },
  };
}) satisfies PageLoad;
