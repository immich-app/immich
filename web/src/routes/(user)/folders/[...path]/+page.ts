import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAllOriginalPaths, searchAssetsByPartialPath } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params }: { params: { path: string } }) => {
  await authenticate();
  const $t = await getFormatter();
  const searchData = params.path && (await searchAssetsByPartialPath({ path: params.path }));
  const paths = await getAllOriginalPaths();

  return {
    path: params.path,
    paths,
    searchData,
    meta: {
      title: $t('Folder View'),
    },
  };
}) satisfies PageLoad;
