import { getAssetsByOriginalPath, getUniqueOriginalPaths } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';
import { TreeNode } from '$lib/utils/tree-utils';

const toTree = (paths: string[]) => {
  const tree = TreeNode.fromPaths(paths);
  tree.collapse();
  return tree;
};

export const getUniqueOriginalPathsQuery = () =>
  queryOptions({
    queryKey: ['view', 'folder', 'unique-paths'],
    queryFn: ({ signal }) => getUniqueOriginalPaths({ signal }),
  });

export const getFolderTreeQuery = () =>
  queryOptions({
    ...getUniqueOriginalPathsQuery(),
    select: toTree,
  });

export const getAssetsByOriginalPathQuery = (path: string) =>
  queryOptions({
    queryKey: ['view', 'folder', 'assets', path],
    queryFn: ({ signal }) => getAssetsByOriginalPath({ path }, { signal }),
  });
