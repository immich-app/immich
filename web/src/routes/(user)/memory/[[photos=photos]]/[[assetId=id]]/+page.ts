import { authenticate } from '$lib/utils/auth';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  const user = await authenticate();
  const asset = await getAssetInfoFromParam(params);
  const $t = get(t);

  return {
    user,
    asset,
    meta: {
      title: $t('memory'),
    },
  };
}) satisfies PageLoad;
