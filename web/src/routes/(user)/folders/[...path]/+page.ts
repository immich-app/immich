import { foldersStore } from '$lib/stores/folders.store';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { getAssetInfo, type AssetResponseDto } from '@immich/sdk';
import { get } from 'svelte/store';
import type { PageLoad } from './[photos=photos]/[assetId=id]/$types';

export const load = (async ({ params }) => {
  await authenticate();
  let asset: AssetResponseDto | undefined = undefined;

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

  const regex = /\/photos\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
  const hasAssetId = regex.test(params.path);
  const assetId = params.path.split('/').pop();

  if (hasAssetId && assetId) {
    asset = await getAssetInfo({ id: assetId });
    console.log(asset);
  }

  return {
    asset,
    path: params.path,
    currentFolders,
    pathAssets,
    meta: {
      title: $t('folders'),
    },
  };
}) satisfies PageLoad;
