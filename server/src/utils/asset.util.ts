import { AccessCore, Permission } from 'src/cores/access.core';
import { BulkIdErrorReason, BulkIdResponseDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { setDifference, setUnion } from 'src/utils/set';

export interface IBulkAsset {
  getAssetIds: (id: string, assetIds: string[]) => Promise<Set<string>>;
  addAssetIds: (id: string, assetIds: string[]) => Promise<void>;
  removeAssetIds: (id: string, assetIds: string[]) => Promise<void>;
}

export const addAssets = async (
  auth: AuthDto,
  repositories: { accessRepository: IAccessRepository; repository: IBulkAsset },
  dto: { id: string; assetIds: string[] },
) => {
  const { accessRepository, repository } = repositories;
  const access = AccessCore.create(accessRepository);

  const existingAssetIds = await repository.getAssetIds(dto.id, dto.assetIds);
  const notPresentAssetIds = dto.assetIds.filter((id) => !existingAssetIds.has(id));
  const allowedAssetIds = await access.checkAccess(auth, Permission.ASSET_SHARE, notPresentAssetIds);

  const results: BulkIdResponseDto[] = [];
  for (const assetId of dto.assetIds) {
    const hasAsset = existingAssetIds.has(assetId);
    if (hasAsset) {
      results.push({ id: assetId, success: false, error: BulkIdErrorReason.DUPLICATE });
      continue;
    }

    const hasAccess = allowedAssetIds.has(assetId);
    if (!hasAccess) {
      results.push({ id: assetId, success: false, error: BulkIdErrorReason.NO_PERMISSION });
      continue;
    }

    existingAssetIds.add(assetId);
    results.push({ id: assetId, success: true });
  }

  const newAssetIds = results.filter(({ success }) => success).map(({ id }) => id);
  if (newAssetIds.length > 0) {
    await repository.addAssetIds(dto.id, newAssetIds);
  }

  return results;
};

export const removeAssets = async (
  auth: AuthDto,
  repositories: { accessRepository: IAccessRepository; repository: IBulkAsset },
  dto: { id: string; assetIds: string[]; permissions: Permission[] },
) => {
  const { accessRepository, repository } = repositories;
  const access = AccessCore.create(accessRepository);

  const existingAssetIds = await repository.getAssetIds(dto.id, dto.assetIds);
  let allowedAssetIds = new Set<string>();
  let remainingAssetIds = existingAssetIds;

  for (const permission of dto.permissions) {
    const newAssetIds = await access.checkAccess(auth, permission, setDifference(remainingAssetIds, allowedAssetIds));
    remainingAssetIds = setDifference(remainingAssetIds, newAssetIds);
    allowedAssetIds = setUnion(allowedAssetIds, newAssetIds);
  }

  const results: BulkIdResponseDto[] = [];
  for (const assetId of dto.assetIds) {
    const hasAsset = existingAssetIds.has(assetId);
    if (!hasAsset) {
      results.push({ id: assetId, success: false, error: BulkIdErrorReason.NOT_FOUND });
      continue;
    }

    const hasAccess = allowedAssetIds.has(assetId);
    if (!hasAccess) {
      results.push({ id: assetId, success: false, error: BulkIdErrorReason.NO_PERMISSION });
      continue;
    }

    existingAssetIds.delete(assetId);
    results.push({ id: assetId, success: true });
  }

  const removedIds = results.filter(({ success }) => success).map(({ id }) => id);
  if (removedIds.length > 0) {
    await repository.removeAssetIds(dto.id, removedIds);
  }

  return results;
};
