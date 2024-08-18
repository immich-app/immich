import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAllOriginalPaths, searchAssetsByPartialPath } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params }: { params: { path: string } }) => {
  await authenticate();
  const $t = await getFormatter();
  const searchData = params.path && (await searchAssetsByPartialPath({ path: params.path }));

  return {
    path: params.path,
    searchData,
    meta: {
      title: $t('Folder View'),
    },
  };
}) satisfies PageLoad;
