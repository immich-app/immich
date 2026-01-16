import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { getAssetDuplicates } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url);
  const asset = await getAssetInfoFromParam(params);
  const $t = await getFormatter();

  const PAGE_SIZE = 200;

  const indexParam = url.searchParams.get('index') ?? '0';
  const parsedIndex = Number.parseInt(indexParam, 10);

  const pageNumber = Math.floor(parsedIndex / PAGE_SIZE) + 1;
  const duplicatesRes = await getAssetDuplicates({ page: pageNumber, size: PAGE_SIZE });

  return {
    asset,
    duplicatesRes,
    pageSize: PAGE_SIZE,
    meta: {
      title: $t('duplicates'),
    },
  };
}) satisfies PageLoad;
