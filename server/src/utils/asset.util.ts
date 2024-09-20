import { BadRequestException } from '@nestjs/common';
import { StorageCore } from 'src/cores/storage.core';
import { BulkIdErrorReason, BulkIdResponseDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetFileEntity } from 'src/entities/asset-files.entity';
import { AssetFileType, AssetType, Permission } from 'src/enum';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { IEventRepository } from 'src/interfaces/event.interface';
import { IPartnerRepository } from 'src/interfaces/partner.interface';
import { checkAccess } from 'src/utils/access';

export interface IBulkAsset {
  getAssetIds: (id: string, assetIds: string[]) => Promise<Set<string>>;
  addAssetIds: (id: string, assetIds: string[]) => Promise<void>;
  removeAssetIds: (id: string, assetIds: string[]) => Promise<void>;
}

const getFileByType = (files: AssetFileEntity[] | undefined, type: AssetFileType) => {
  return (files || []).find((file) => file.type === type);
};

export const getAssetFiles = (files?: AssetFileEntity[]) => ({
  previewFile: getFileByType(files, AssetFileType.PREVIEW),
  thumbnailFile: getFileByType(files, AssetFileType.THUMBNAIL),
});

export const addAssets = async (
  auth: AuthDto,
  repositories: { access: IAccessRepository; bulk: IBulkAsset },
  dto: { parentId: string; assetIds: string[] },
) => {
  const { access, bulk } = repositories;
  const existingAssetIds = await bulk.getAssetIds(dto.parentId, dto.assetIds);
  const notPresentAssetIds = dto.assetIds.filter((id) => !existingAssetIds.has(id));
  const allowedAssetIds = await checkAccess(access, {
    auth,
    permission: Permission.ASSET_SHARE,
    ids: notPresentAssetIds,
  });

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
    await bulk.addAssetIds(dto.parentId, newAssetIds);
  }

  return results;
};

export const removeAssets = async (
  auth: AuthDto,
  repositories: { access: IAccessRepository; bulk: IBulkAsset },
  dto: { parentId: string; assetIds: string[]; canAlwaysRemove: Permission },
) => {
  const { access, bulk } = repositories;

  // check if the user can always remove from the parent album, memory, etc.
  const canAlwaysRemove = await checkAccess(access, { auth, permission: dto.canAlwaysRemove, ids: [dto.parentId] });
  const existingAssetIds = await bulk.getAssetIds(dto.parentId, dto.assetIds);
  const allowedAssetIds = canAlwaysRemove.has(dto.parentId)
    ? existingAssetIds
    : await checkAccess(access, { auth, permission: Permission.ASSET_SHARE, ids: existingAssetIds });

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
    await bulk.removeAssetIds(dto.parentId, removedIds);
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

export type AssetHookRepositories = { asset: IAssetRepository; event: IEventRepository };

export const onBeforeLink = async (
  { asset: assetRepository, event: eventRepository }: AssetHookRepositories,
  { userId, livePhotoVideoId }: { userId: string; livePhotoVideoId: string },
) => {
  const motionAsset = await assetRepository.getById(livePhotoVideoId);
  if (!motionAsset) {
    throw new BadRequestException('Live photo video not found');
  }
  if (motionAsset.type !== AssetType.VIDEO) {
    throw new BadRequestException('Live photo video must be a video');
  }
  if (motionAsset.ownerId !== userId) {
    throw new BadRequestException('Live photo video does not belong to the user');
  }

  if (motionAsset?.isVisible) {
    await assetRepository.update({ id: livePhotoVideoId, isVisible: false });
    await eventRepository.emit('asset.hide', { assetId: motionAsset.id, userId });
  }
};

export const onBeforeUnlink = async (
  { asset: assetRepository }: AssetHookRepositories,
  { livePhotoVideoId }: { livePhotoVideoId: string },
) => {
  const motion = await assetRepository.getById(livePhotoVideoId);
  if (!motion) {
    return null;
  }

  if (StorageCore.isAndroidMotionPath(motion.originalPath)) {
    throw new BadRequestException('Cannot unlink Android motion photos');
  }

  return motion;
};

export const onAfterUnlink = async (
  { asset: assetRepository, event: eventRepository }: AssetHookRepositories,
  { userId, livePhotoVideoId }: { userId: string; livePhotoVideoId: string },
) => {
  await assetRepository.update({ id: livePhotoVideoId, isVisible: true });
  await eventRepository.emit('asset.show', { assetId: livePhotoVideoId, userId });
};
