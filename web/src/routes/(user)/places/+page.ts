import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetsByCity } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();
  const items = await getAssetsByCity();
  const $t = await getFormatter();

  return {
    items,
    meta: {
      title: $t('places'),
    },
  };
}) satisfies PageLoad;
