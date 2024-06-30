import { AccessCore, Permission } from 'src/cores/access.core';
import { BulkIdErrorReason, BulkIdResponseDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { IPartnerRepository } from 'src/interfaces/partner.interface';

export interface IBulkAsset {
  getAssetIds: (id: string, assetIds: string[]) => Promise<Set<string>>;
  addAssetIds: (id: string, assetIds: string[]) => Promise<void>;
  removeAssetIds: (id: string, assetIds: string[]) => Promise<void>;
}

export const addAssets = async (
  auth: AuthDto,
  repositories: { accessRepository: IAccessRepository; repository: IBulkAsset },
  dto: { parentId: string; assetIds: string[] },
) => {
  const { accessRepository, repository } = repositories;
  const access = AccessCore.create(accessRepository);

  const existingAssetIds = await repository.getAssetIds(dto.parentId, dto.assetIds);
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
    await repository.addAssetIds(dto.parentId, newAssetIds);
  }

  return results;
};

export const removeAssets = async (
  auth: AuthDto,
  repositories: { accessRepository: IAccessRepository; repository: IBulkAsset },
  dto: { parentId: string; assetIds: string[]; canAlwaysRemove: Permission },
) => {
  const { accessRepository, repository } = repositories;
  const access = AccessCore.create(accessRepository);

  // check if the user can always remove from the parent album, memory, etc.
  const canAlwaysRemove = await access.checkAccess(auth, dto.canAlwaysRemove, [dto.parentId]);
  const existingAssetIds = await repository.getAssetIds(dto.parentId, dto.assetIds);
  const allowedAssetIds = canAlwaysRemove.has(dto.parentId)
    ? existingAssetIds
    : await access.checkAccess(auth, Permission.ASSET_SHARE, existingAssetIds);

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
    await repository.removeAssetIds(dto.parentId, removedIds);
  }

  return results;
};

export type PartnerIdOptions = {
  userId: string;
  repository: IPartnerRepository;
  /** only include partners with `inTimeline: true` */
  timelineEnabled?: boolean;
};
export const getMyPartnerIds = async ({ userId, repository, timelineEnabled }: PartnerIdOptions) => {
  const partnerIds = new Set<string>();
  const partners = await repository.getAll(userId);
  for (const partner of partners) {
    // ignore deleted users
    if (!partner.sharedBy || !partner.sharedWith) {
      continue;
    }

    // wrong direction
    if (partner.sharedWithId !== userId) {
      continue;
    }

    if (timelineEnabled && !partner.inTimeline) {
      continue;
    }

    partnerIds.add(partner.sharedById);
  }

  return [...partnerIds];
};
