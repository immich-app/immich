import { QueryParameter } from '$lib/constants';
import { foldersStore } from '$lib/stores/folders.svelte';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { buildTree, normalizeTreePath } from '$lib/utils/tree-utils';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate();
  const asset = await getAssetInfoFromParam(params);
  const $t = await getFormatter();

  await foldersStore.fetchUniquePaths();

  let pathAssets = null;

  const path = url.searchParams.get(QueryParameter.PATH);
  if (path) {
    await foldersStore.fetchAssetsByPath(path);
    pathAssets = foldersStore.assets[path] || null;
  }

  let tree = buildTree(foldersStore.uniquePaths);
  const parts = normalizeTreePath(path || '').split('/');
  for (const part of parts) {
    tree = tree?.[part];
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
