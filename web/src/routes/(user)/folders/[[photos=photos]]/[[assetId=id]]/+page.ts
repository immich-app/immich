import { QueryParameter } from '$lib/constants';
import { foldersStore } from '$lib/stores/folders.svelte';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url);
  let [tree, asset, $t] = await Promise.all([foldersStore.fetchTree(), getAssetInfoFromParam(params), getFormatter()]);

  const path = url.searchParams.get(QueryParameter.PATH);
  if (path) {
    tree = tree.closestRelativeNode(path);
  } else if (path === null) {
    // If no path is provided, we've just navigated to the folders page.
    // We should bust the asset cache of the folder store, to make sure we don't show stale data
    foldersStore.bustAssetCache();
  }

  // only fetch assets if the folder has assets
  const pathAssets = tree.hasLeaf ? await foldersStore.fetchAssetsByPath(tree.path) : null;

  return {
    asset,
    tree,
    pathAssets,
    meta: {
      title: $t('folders'),
    },
  };
}) satisfies PageLoad;
