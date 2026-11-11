import { QueryParameter } from '#lib/constants.ts';
import { queryClient } from '#lib/queries/client.ts';
import { getAssetsByOriginalPathQuery, getFolderTreeQuery } from '#lib/queries/view.query.ts';
import { authenticate } from '#lib/utils/auth.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  const [root, $t] = await Promise.all([queryClient.query(getFolderTreeQuery()), getFormatter()]);

  let tree = root;
  const path = url.searchParams.get(QueryParameter.PATH);
  if (path) {
    tree = tree.traverse(path);
  } else if (path === null) {
    queryClient.removeQueries({ queryKey: ['view', 'folder', 'assets'] });
  }

  const pathAssets = tree.hasAssets ? await queryClient.query(getAssetsByOriginalPathQuery(tree.path)) : null;

  return {
    tree,
    pathAssets,
    meta: {
      title: $t('folders'),
    },
  };
}) satisfies PageLoad;
