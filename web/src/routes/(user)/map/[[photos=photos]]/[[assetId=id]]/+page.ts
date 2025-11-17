import { goto } from '$app/navigation';
import { AppRoute } from '$lib/constants';
import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
import { handlePromiseError } from '$lib/utils';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url);
  const asset = await getAssetInfoFromParam(params);
  const $t = await getFormatter();

  if (!featureFlagsManager.value.map) {
    handlePromiseError(goto(AppRoute.PHOTOS));
  }

  return {
    asset,
    meta: {
      title: $t('map'),
    },
  };
}) satisfies PageLoad;
