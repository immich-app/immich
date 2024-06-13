import { authenticate } from '$lib/utils/auth';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { getUser } from '@immich/sdk';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  await authenticate();

  const partner = await getUser({ id: params.userId });
  const asset = await getAssetInfoFromParam(params);
  const $t = get(t);

  return {
    asset,
    partner,
    meta: {
      title: $t('partner'),
    },
  };
}) satisfies PageLoad;
