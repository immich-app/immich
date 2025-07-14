import { QueryParameter } from '$lib/constants';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { getAllTags } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url);
  const asset = await getAssetInfoFromParam(params);
  const $t = await getFormatter();

  const tags = await getAllTags();

  return {
    path: url.searchParams.get(QueryParameter.PATH) ?? '',
    tags,
    asset,
    meta: {
      title: $t('tags'),
    },
  };
}) satisfies PageLoad;
