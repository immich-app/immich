import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { getAssetDuplicates } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url);
  const asset = await getAssetInfoFromParam(params);
  const $t = await getFormatter();

  const indexParam = url.searchParams.get('index') ?? '0';
  const parsedIndex = Number.parseInt(indexParam, 10);

  const duplicatesRes = await getAssetDuplicates({ page: parsedIndex + 1, size: 1 });

  return {
    asset,
    duplicatesRes,
    meta: {
      title: $t('duplicates'),
    },
  };
}) satisfies PageLoad;
