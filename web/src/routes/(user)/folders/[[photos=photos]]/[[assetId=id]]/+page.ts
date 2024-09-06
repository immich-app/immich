import { QueryParameter } from '$lib/constants';
import { foldersStore } from '$lib/stores/folders.store';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { buildTree, normalizeTreePath } from '$lib/utils/tree-utils';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate();
  const asset = await getAssetInfoFromParam(params);
  const $t = await getFormatter();

  await foldersStore.fetchUniquePaths();
  const { uniquePaths } = get(foldersStore);

  let pathAssets = null;

  const path = url.searchParams.get(QueryParameter.PATH);
  if (path) {
    await foldersStore.fetchAssetsByPath(path);
    const { assets } = get(foldersStore);
    pathAssets = assets[path] || null;
  }

  let tree = buildTree(uniquePaths || []);
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
