import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { QueryKeys } from '#lib/queries/query-keys.ts';
import { AssetFileType, searchAssetFiles } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

export const getOriginalFileQuery = (assetId: string) =>
  queryOptions({
    queryKey: QueryKeys.assetFiles({ assetId, $type: AssetFileType.Original }),
    queryFn: ({ signal }) =>
      searchAssetFiles({ ...authManager.params, assetId, $type: AssetFileType.Original }, { signal }),
    select: ([file]) => file,
  });
