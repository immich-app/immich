import { foldersStore } from '$lib/stores/folders.store';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load = (async ({ params }: { params: { path: string } }) => {
  await authenticate();
  const $t = await getFormatter();

  await foldersStore.fetchUniquePaths();
  const { uniquePaths } = get(foldersStore);

  let pathAssets = null;

  if (params.path) {
    await foldersStore.fetchAssetsByPath(params.path);
    const updatedStore = get(foldersStore);
    pathAssets = updatedStore.assets[params.path] || null;
  }

  const currentPath = params.path ? `${params.path}/`.replace('//', '/') : '';

  const currentFolders = (uniquePaths || [])
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
