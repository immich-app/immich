import type { AssetResponseDto } from '@immich/sdk';

type DuplicateStackGroup = {
  duplicateId: string;
  assets: Array<Pick<AssetResponseDto, 'id'>>;
  suggestedKeepAssetIds: string[];
};

export type StackableDuplicateGroup = {
  duplicateId: string;
  assetIds: string[];
};

type StackDuplicateGroupsOptions = {
  createStack: (assetIds: string[]) => unknown | Promise<unknown>;
  updateAssets: (assetIds: string[]) => unknown | Promise<unknown>;
  onError?: (duplicateId: string, error: unknown) => void;
  onProgress?: (progress: StackDuplicateGroupsProgress) => void;
};

type StackDuplicateGroupsResult = {
  succeededDuplicateIds: string[];
  failedDuplicateIds: string[];
};

export type StackDuplicateGroupsProgress = {
  completedCount: number;
  failedCount: number;
  succeededCount: number;
  totalCount: number;
};

export const getStackableDuplicateGroups = (duplicates: DuplicateStackGroup[]): StackableDuplicateGroup[] => {
  const stackableGroups: StackableDuplicateGroup[] = [];

  for (const { duplicateId, assets, suggestedKeepAssetIds } of duplicates) {
    const keepIds = new Set(suggestedKeepAssetIds);
    const suggestedAssetIds = assets.filter((asset) => keepIds.has(asset.id)).map((asset) => asset.id);
    const otherAssetIds = assets.filter((asset) => !keepIds.has(asset.id)).map((asset) => asset.id);
    const assetIds = [...suggestedAssetIds, ...otherAssetIds];

    if (assetIds.length < 2) {
      continue;
    }

    stackableGroups.push({ duplicateId, assetIds });
  }

  return stackableGroups;
};

export const stackDuplicateGroups = async (
  groups: StackableDuplicateGroup[],
  { createStack, updateAssets, onError, onProgress }: StackDuplicateGroupsOptions,
): Promise<StackDuplicateGroupsResult> => {
  const succeededDuplicateIds: string[] = [];
  const failedDuplicateIds: string[] = [];
  const totalCount = groups.length;

  for (const { duplicateId, assetIds } of groups) {
    try {
      await createStack(assetIds);
      await updateAssets(assetIds);
      succeededDuplicateIds.push(duplicateId);
    } catch (error) {
      failedDuplicateIds.push(duplicateId);
      onError?.(duplicateId, error);
    }

    onProgress?.({
      completedCount: succeededDuplicateIds.length + failedDuplicateIds.length,
      failedCount: failedDuplicateIds.length,
      succeededCount: succeededDuplicateIds.length,
      totalCount,
    });
  }

  return { succeededDuplicateIds, failedDuplicateIds };
};
