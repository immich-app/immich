import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetsByOriginalPath, getUniqueOriginalPaths } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params }: { params: { path: string } }) => {
  await authenticate();
  const $t = await getFormatter();

  const uniqueOriginalPaths = await getUniqueOriginalPaths();
  const pathAssets = params.path && (await getAssetsByOriginalPath({ path: params.path }));

  const currentPath = params.path ? `${params.path}/`.replace('//', '/') : '';

  const currentFolders = uniqueOriginalPaths
    .filter((path) => path.startsWith(currentPath) && path !== currentPath)
    .map((path) => path.replace(currentPath, '').split('/')[0])
    .filter((value, index, self) => self.indexOf(value) === index);

  return {
    path: params.path,
    currentFolders,
    pathAssets,
    meta: {
      title: $t('Folder View'),
    },
  };
}) satisfies PageLoad;
