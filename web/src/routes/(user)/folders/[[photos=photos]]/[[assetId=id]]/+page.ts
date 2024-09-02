import { QueryParameter } from '$lib/constants';
import { foldersStore } from '$lib/stores/folders.store';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { FOLDER_WITH_ASSETS_SYMBOL, getPathParts, normalizeTreePath } from '$lib/utils/tree-utils';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate();
  const asset = await getAssetInfoFromParam(params);
  const $t = await getFormatter();

  let { folders: tree } = await foldersStore.fetchUniquePaths();

  let pathAssets = null;

  const currentFolders = Object.keys(tree || {});
  const path = url.searchParams.get(QueryParameter.PATH) || currentFolders[0] || '';
  if (tree) {
    const parts = getPathParts(normalizeTreePath(path));
    for (const part of parts) {
      if (!tree[part]) {
        break;
      }
      tree = tree[part];
    }

    // only fetch assets if the folder has assets
    if (tree[FOLDER_WITH_ASSETS_SYMBOL]) {
      const { assets } = await foldersStore.fetchAssetsByPath(path);
      pathAssets = assets[path] || null;
    }
  }

  return {
    asset,
    path,
    currentFolders: Object.keys(tree || {}),
    pathAssets,
    meta: {
      title: $t('folders'),
    },
  };
}) satisfies PageLoad;
