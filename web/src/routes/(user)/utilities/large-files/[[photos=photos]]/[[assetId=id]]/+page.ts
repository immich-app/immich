import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { searchLargeAssets } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  const assets = await searchLargeAssets({ minFileSize: 0 });
  const $t = await getFormatter();

  return {
    assets,
    meta: {
      title: $t('large_files'),
    },
  };
}) satisfies PageLoad;
