import { eventManager } from '#lib/managers/event-manager.svelte.ts';
import { asMutation } from '#lib/queries/client.ts';
import { QueryKeys } from '#lib/queries/query-keys.ts';
import {
  checkBulkUpload,
  deleteAssets,
  editAsset,
  getAssetEdits,
  getAssetOcr,
  getAssetStatistics,
  removeAssetEdits,
  runAssetJobs,
  updateAsset,
  updateAssets,
} from '@immich/sdk';
import { queryOptions, type MutationMeta } from '@tanstack/svelte-query';

type AssetStatisticsFilter = Parameters<typeof getAssetStatistics>[0];

export const getAssetStatisticsQuery = (filter: AssetStatisticsFilter) =>
  queryOptions({
    queryKey: QueryKeys.assetStatistics(filter),
    queryFn: ({ signal }) => getAssetStatistics(filter, { signal }),
    staleTime: 0,
  });

export const getAssetOcrQuery = (id: string) =>
  queryOptions({
    queryKey: QueryKeys.assetOcr({ id }),
    queryFn: ({ signal }) => getAssetOcr({ id }, { signal }),
    staleTime: 0,
  });

export const getAssetEditsQuery = (id: string) =>
  queryOptions({
    queryKey: QueryKeys.assetEdits({ id }),
    queryFn: ({ signal }) => getAssetEdits({ id }, { signal }),
    staleTime: 0,
  });

export const checkBulkUploadMutation = () => asMutation(checkBulkUpload, { meta: { error: { toast: false } } });

export const runAssetJobsMutation = () =>
  asMutation(runAssetJobs, { meta: { error: { toast: 'errors.unable_to_submit_job' } } });

export const updateAssetMutation = (meta?: MutationMeta) =>
  asMutation(updateAsset, { onSuccess: (asset) => eventManager.emit('AssetUpdate', asset), meta });

export const updateAssetsMutation = (meta?: MutationMeta) => asMutation(updateAssets, { meta });

export const deleteAssetsMutation = (meta?: MutationMeta) =>
  asMutation(deleteAssets, {
    onSuccess: (_, [{ assetBulkDeleteDto }]) => eventManager.emit('AssetsDelete', assetBulkDeleteDto.ids),
    meta: meta ?? { error: { toast: 'errors.unable_to_delete_assets' } },
  });

export const editAssetMutation = () => asMutation(editAsset, { meta: { error: { toast: false } } });

export const removeAssetEditsMutation = () => asMutation(removeAssetEdits, { meta: { error: { toast: false } } });
