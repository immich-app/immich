import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetDuplicates } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url);
  const duplicates = await getAssetDuplicates();
  const $t = await getFormatter();

  return {
    assetId: params.assetId,
    duplicates,
    meta: {
      title: $t('duplicates'),
    },
  };
}) satisfies PageLoad;
