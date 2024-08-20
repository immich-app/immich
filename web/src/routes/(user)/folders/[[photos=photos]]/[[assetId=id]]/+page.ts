import { foldersStore } from '$lib/stores/folders.store';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate();
  const asset = await getAssetInfoFromParam(params);
  const $t = await getFormatter();

  await foldersStore.fetchUniquePaths();
  const { uniquePaths } = get(foldersStore);

  let pathAssets = null;
  const path = url.searchParams.get('folder');

  if (path) {
    await foldersStore.fetchAssetsByPath(path);
    const { assets } = get(foldersStore);
    pathAssets = assets[path] || null;
  }

  const currentPath = path ? `${path}/`.replace('//', '/') : '';

  const currentFolders = (uniquePaths || [])
    .filter((path) => path.startsWith(currentPath) && path !== currentPath)
    .map((path) => path.replace(currentPath, '').split('/')[0])
    .filter((value, index, self) => self.indexOf(value) === index);

  return {
    asset,
    path,
    currentFolders,
    pathAssets,
    meta: {
      title: $t('folders'),
    },
  };
}) satisfies PageLoad;
