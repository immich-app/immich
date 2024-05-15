import { BadRequestException, Inject } from '@nestjs/common';
import _ from 'lodash';
import { DateTime, Duration } from 'luxon';
import { extname } from 'node:path';
import sanitize from 'sanitize-filename';
import { AccessCore, Permission } from 'src/cores/access.core';
import { StorageCore, StorageFolder } from 'src/cores/storage.core';
import { SystemConfigCore } from 'src/cores/system-config.core';
import {
  AssetResponseDto,
  MemoryLaneResponseDto,
  SanitizedAssetResponseDto,
  mapAsset,
} from 'src/dtos/asset-response.dto';
import { AssetFileUploadResponseDto } from 'src/dtos/asset-v1-response.dto';
import {
  AssetBulkDeleteDto,
  AssetBulkUpdateDto,
  AssetJobName,
  AssetJobsDto,
  AssetStatsDto,
  UpdateAssetDto,
  UploadFieldName,
  mapStats,
} from 'src/dtos/asset.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { MapMarkerDto, MapMarkerResponseDto, MemoryLaneDto } from 'src/dtos/search.dto';
import { UpdateStackParentDto } from 'src/dtos/stack.dto';
import { AssetEntity } from 'src/entities/asset.entity';
import { LibraryType } from 'src/entities/library.entity';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { IAlbumRepository } from 'src/interfaces/album.interface';
import { IAssetStackRepository } from 'src/interfaces/asset-stack.interface';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { ClientEvent, IEventRepository } from 'src/interfaces/event.interface';
import {
  IEntityJob,
  IJobRepository,
  ISidecarWriteJob,
  JOBS_ASSET_PAGINATION_SIZE,
  JobItem,
  JobName,
  JobStatus,
} from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IPartnerRepository } from 'src/interfaces/partner.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { mimeTypes } from 'src/utils/mime-types';
import { usePagination } from 'src/utils/pagination';
import { fromChecksum } from 'src/utils/request';

export interface UploadRequest {
  auth: AuthDto | null;
  fieldName: UploadFieldName;
  file: UploadFile;
}

export interface UploadFile {
  uuid: string;
  checksum: Buffer;
  originalPath: string;
  originalName: string;
  size: number;
}

export class AssetService {
  private access: AccessCore;
  private configCore: SystemConfigCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ISystemMetadataRepository) systemMetadataRepository: ISystemMetadataRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(IEventRepository) private eventRepository: IEventRepository,
    @Inject(IPartnerRepository) private partnerRepository: IPartnerRepository,
    @Inject(IAssetStackRepository) private assetStackRepository: IAssetStackRepository,
    @Inject(IAlbumRepository) private albumRepository: IAlbumRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(AssetService.name);
    this.access = AccessCore.create(accessRepository);
    this.configCore = SystemConfigCore.create(systemMetadataRepository, this.logger);
  }

  async getUploadAssetIdByChecksum(auth: AuthDto, checksum?: string): Promise<AssetFileUploadResponseDto | undefined> {
    if (!checksum) {
      return;
    }

    const assetId = await this.assetRepository.getUploadAssetIdByChecksum(auth.user.id, fromChecksum(checksum));
    if (!assetId) {
      return;
    }

    return { id: assetId, duplicate: true };
  }

  canUploadFile({ auth, fieldName, file }: UploadRequest): true {
    this.access.requireUploadAccess(auth);

    const filename = file.originalName;

    switch (fieldName) {
      case UploadFieldName.ASSET_DATA: {
        if (mimeTypes.isAsset(filename)) {
          return true;
        }
        break;
      }

      case UploadFieldName.LIVE_PHOTO_DATA: {
        if (mimeTypes.isVideo(filename)) {
          return true;
        }
        break;
      }

      case UploadFieldName.SIDECAR_DATA: {
        if (mimeTypes.isSidecar(filename)) {
          return true;
        }
        break;
      }

      case UploadFieldName.PROFILE_DATA: {
        if (mimeTypes.isProfile(filename)) {
          return true;
        }
        break;
      }
    }

    this.logger.error(`Unsupported file type ${filename}`);
    throw new BadRequestException(`Unsupported file type ${filename}`);
  }

  getUploadFilename({ auth, fieldName, file }: UploadRequest): string {
    this.access.requireUploadAccess(auth);

    const originalExtension = extname(file.originalName);

    const lookup = {
      [UploadFieldName.ASSET_DATA]: originalExtension,
      [UploadFieldName.LIVE_PHOTO_DATA]: '.mov',
      [UploadFieldName.SIDECAR_DATA]: '.xmp',
      [UploadFieldName.PROFILE_DATA]: originalExtension,
    };

    return sanitize(`${file.uuid}${lookup[fieldName]}`);
  }

  getUploadFolder({ auth, fieldName, file }: UploadRequest): string {
    auth = this.access.requireUploadAccess(auth);

    let folder = StorageCore.getNestedFolder(StorageFolder.UPLOAD, auth.user.id, file.uuid);
    if (fieldName === UploadFieldName.PROFILE_DATA) {
      folder = StorageCore.getFolderLocation(StorageFolder.PROFILE, auth.user.id);
    }

    this.storageRepository.mkdirSync(folder);

    return folder;
  }

  async getMapMarkers(auth: AuthDto, options: MapMarkerDto): Promise<MapMarkerResponseDto[]> {
    const userIds: string[] = [auth.user.id];
    // TODO convert to SQL join
    if (options.withPartners) {
      const partners = await this.partnerRepository.getAll(auth.user.id);
      const partnersIds = partners
        .filter((partner) => partner.sharedBy && partner.sharedWith && partner.sharedById != auth.user.id)
        .map((partner) => partner.sharedById);
      userIds.push(...partnersIds);
    }

    // TODO convert to SQL join
    const albumIds: string[] = [];
    if (options.withSharedAlbums) {
      const [ownedAlbums, sharedAlbums] = await Promise.all([
        this.albumRepository.getOwned(auth.user.id),
        this.albumRepository.getShared(auth.user.id),
      ]);
      albumIds.push(...ownedAlbums.map((album) => album.id), ...sharedAlbums.map((album) => album.id));
    }

    return this.assetRepository.getMapMarkers(userIds, albumIds, options);
  }

  async getMemoryLane(auth: AuthDto, dto: MemoryLaneDto): Promise<MemoryLaneResponseDto[]> {
    const currentYear = new Date().getFullYear();

    // get partners id
    const userIds: string[] = [auth.user.id];
    const partners = await this.partnerRepository.getAll(auth.user.id);
    const partnersIds = partners
      .filter((partner) => partner.sharedBy && partner.inTimeline)
      .map((partner) => partner.sharedById);
    userIds.push(...partnersIds);

    const assets = await this.assetRepository.getByDayOfYear(userIds, dto);
    const groups: Record<number, AssetEntity[]> = {};
    for (const asset of assets) {
      const yearsAgo = currentYear - asset.localDateTime.getFullYear();
      if (!groups[yearsAgo]) {
        groups[yearsAgo] = [];
      }
      groups[yearsAgo].push(asset);
    }

    return Object.keys(groups)
      .map(Number)
      .sort((a, b) => a - b)
      .filter((yearsAgo) => yearsAgo > 0)
      .map((yearsAgo) => ({
        yearsAgo,
        // TODO move this to clients
        title: `${yearsAgo} year${yearsAgo > 1 ? 's' : ''} ago`,
        assets: groups[yearsAgo].map((asset) => mapAsset(asset, { auth })),
      }));
  }

  async getStatistics(auth: AuthDto, dto: AssetStatsDto) {
    const stats = await this.assetRepository.getStatistics(auth.user.id, dto);
    return mapStats(stats);
  }

  async getRandom(auth: AuthDto, count: number): Promise<AssetResponseDto[]> {
    const assets = await this.assetRepository.getRandom(auth.user.id, count);
    return assets.map((a) => mapAsset(a, { auth }));
  }

  async getUserAssetsByDeviceId(auth: AuthDto, deviceId: string) {
    return this.assetRepository.getAllByDeviceId(auth.user.id, deviceId);
  }

  async get(auth: AuthDto, id: string): Promise<AssetResponseDto | SanitizedAssetResponseDto> {
    await this.access.requirePermission(auth, Permission.ASSET_READ, id);

    const asset = await this.assetRepository.getById(
      id,
      {
        exifInfo: true,
        tags: true,
        sharedLinks: true,
        smartInfo: true,
        owner: true,
        faces: {
          person: true,
        },
        stack: {
          assets: {
            exifInfo: true,
          },
        },
      },
      {
        faces: {
          boundingBoxX1: 'ASC',
        },
      },
    );

    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    if (auth.sharedLink && !auth.sharedLink.showExif) {
      return mapAsset(asset, { stripMetadata: true, withStack: true, auth });
    }

    const data = mapAsset(asset, { withStack: true, auth });

    if (auth.sharedLink) {
      delete data.owner;
    }

    if (data.ownerId !== auth.user.id || auth.sharedLink) {
      data.people = [];
    }

    return data;
  }

  async update(auth: AuthDto, id: string, dto: UpdateAssetDto): Promise<AssetResponseDto> {
    await this.access.requirePermission(auth, Permission.ASSET_UPDATE, id);

    const { description, dateTimeOriginal, latitude, longitude, ...rest } = dto;
    await this.updateMetadata({ id, description, dateTimeOriginal, latitude, longitude });

    await this.assetRepository.update({ id, ...rest });
    const asset = await this.assetRepository.getById(id, {
      exifInfo: true,
      owner: true,
      smartInfo: true,
      tags: true,
      faces: {
        person: true,
      },
    });
    if (!asset) {
      throw new BadRequestException('Asset not found');
    }
    return mapAsset(asset, { auth });
  }

  async updateAll(auth: AuthDto, dto: AssetBulkUpdateDto): Promise<void> {
    const { ids, removeParent, dateTimeOriginal, latitude, longitude, ...options } = dto;
    await this.access.requirePermission(auth, Permission.ASSET_UPDATE, ids);

    // TODO: refactor this logic into separate API calls POST /stack, PUT /stack, etc.
    const stackIdsToCheckForDelete: string[] = [];
    if (removeParent) {
      (options as Partial<AssetEntity>).stack = null;
      const assets = await this.assetRepository.getByIds(ids, { stack: true });
      stackIdsToCheckForDelete.push(...new Set(assets.filter((a) => !!a.stackId).map((a) => a.stackId!)));
      // This updates the updatedAt column of the parents to indicate that one of its children is removed
      // All the unique parent's -> parent is set to null
      await this.assetRepository.updateAll(
        assets.filter((a) => !!a.stack?.primaryAssetId).map((a) => a.stack!.primaryAssetId!),
        { updatedAt: new Date() },
      );
    } else if (options.stackParentId) {
      //Creating new stack if parent doesn't have one already. If it does, then we add to the existing stack
      await this.access.requirePermission(auth, Permission.ASSET_UPDATE, options.stackParentId);
      const primaryAsset = await this.assetRepository.getById(options.stackParentId, { stack: { assets: true } });
      if (!primaryAsset) {
        throw new BadRequestException('Asset not found for given stackParentId');
      }
      let stack = primaryAsset.stack;

      ids.push(options.stackParentId);
      const assets = await this.assetRepository.getByIds(ids, { stack: { assets: true } });
      stackIdsToCheckForDelete.push(
        ...new Set(assets.filter((a) => !!a.stackId && stack?.id !== a.stackId).map((a) => a.stackId!)),
      );
      const assetsWithChildren = assets.filter((a) => a.stack && a.stack.assets.length > 0);
      ids.push(...assetsWithChildren.flatMap((child) => child.stack!.assets.map((gChild) => gChild.id)));

      if (stack) {
        await this.assetStackRepository.update({
          id: stack.id,
          primaryAssetId: primaryAsset.id,
          assets: ids.map((id) => ({ id }) as AssetEntity),
        });
      } else {
        stack = await this.assetStackRepository.create({
          primaryAssetId: primaryAsset.id,
          assets: ids.map((id) => ({ id }) as AssetEntity),
        });
      }

      // Merge stacks
      options.stackParentId = undefined;
      (options as Partial<AssetEntity>).updatedAt = new Date();
    }

    for (const id of ids) {
      await this.updateMetadata({ id, dateTimeOriginal, latitude, longitude });
    }

    await this.assetRepository.updateAll(ids, options);
    const stackIdsToDelete = await Promise.all(
      stackIdsToCheckForDelete.map((id) => this.assetStackRepository.getById(id)),
    );
    const stacksToDelete = stackIdsToDelete
      .flatMap((stack) => (stack ? [stack] : []))
      .filter((stack) => stack.assets.length < 2);
    await Promise.all(stacksToDelete.map((as) => this.assetStackRepository.delete(as.id)));
    this.eventRepository.clientSend(ClientEvent.ASSET_STACK_UPDATE, auth.user.id, ids);
  }

  async handleAssetDeletionCheck(): Promise<JobStatus> {
    const config = await this.configCore.getConfig();
    const trashedDays = config.trash.enabled ? config.trash.days : 0;
    const trashedBefore = DateTime.now()
      .minus(Duration.fromObject({ days: trashedDays }))
      .toJSDate();
    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) =>
      this.assetRepository.getAll(pagination, { trashedBefore }),
    );

    for await (const assets of assetPagination) {
      await this.jobRepository.queueAll(
        assets.map((asset) => ({ name: JobName.ASSET_DELETION, data: { id: asset.id } })),
      );
    }

    return JobStatus.SUCCESS;
  }

  async handleAssetDeletion(job: IEntityJob): Promise<JobStatus> {
    const { id } = job;

    const asset = await this.assetRepository.getById(id, {
      faces: {
        person: true,
      },
      library: true,
      stack: { assets: true },
      exifInfo: true,
    });

    if (!asset) {
      return JobStatus.FAILED;
    }

    // Replace the parent of the stack children with a new asset
    if (asset.stack?.primaryAssetId === id) {
      const stackAssetIds = asset.stack.assets.map((a) => a.id);
      if (stackAssetIds.length > 2) {
        const newPrimaryAssetId = stackAssetIds.find((a) => a !== id)!;
        await this.assetStackRepository.update({
          id: asset.stack.id,
          primaryAssetId: newPrimaryAssetId,
        });
      } else {
        await this.assetStackRepository.delete(asset.stack.id);
      }
    }

    await this.assetRepository.remove(asset);
    if (asset.library.type === LibraryType.UPLOAD) {
      await this.userRepository.updateUsage(asset.ownerId, -(asset.exifInfo?.fileSizeInByte || 0));
    }
    this.eventRepository.clientSend(ClientEvent.ASSET_DELETE, asset.ownerId, id);

    // TODO refactor this to use cascades
    if (asset.livePhotoVideoId) {
      await this.jobRepository.queue({ name: JobName.ASSET_DELETION, data: { id: asset.livePhotoVideoId } });
    }

    const files = [asset.thumbnailPath, asset.previewPath, asset.encodedVideoPath];
    // skip originals if the user deleted the whole library
    if (!asset.library.deletedAt) {
      files.push(asset.sidecarPath, asset.originalPath);
    }

    await this.jobRepository.queue({ name: JobName.DELETE_FILES, data: { files } });

    return JobStatus.SUCCESS;
  }

  async deleteAll(auth: AuthDto, dto: AssetBulkDeleteDto): Promise<void> {
    const { ids, force } = dto;

    await this.access.requirePermission(auth, Permission.ASSET_DELETE, ids);

    if (force) {
      await this.jobRepository.queueAll(ids.map((id) => ({ name: JobName.ASSET_DELETION, data: { id } })));
    } else {
      await this.assetRepository.softDeleteAll(ids);
      this.eventRepository.clientSend(ClientEvent.ASSET_TRASH, auth.user.id, ids);
    }
  }

  async updateStackParent(auth: AuthDto, dto: UpdateStackParentDto): Promise<void> {
    const { oldParentId, newParentId } = dto;
    await this.access.requirePermission(auth, Permission.ASSET_READ, oldParentId);
    await this.access.requirePermission(auth, Permission.ASSET_UPDATE, newParentId);

    const childIds: string[] = [];
    const oldParent = await this.assetRepository.getById(oldParentId, {
      faces: {
        person: true,
      },
      library: true,
      stack: {
        assets: true,
      },
    });
    if (!oldParent?.stackId) {
      throw new Error('Asset not found or not in a stack');
    }
    if (oldParent != null) {
      // Get all children of old parent
      childIds.push(oldParent.id, ...(oldParent.stack?.assets.map((a) => a.id) ?? []));
    }
    await this.assetStackRepository.update({
      id: oldParent.stackId,
      primaryAssetId: newParentId,
    });

    this.eventRepository.clientSend(ClientEvent.ASSET_STACK_UPDATE, auth.user.id, [
      ...childIds,
      newParentId,
      oldParentId,
    ]);
    await this.assetRepository.updateAll([oldParentId, newParentId, ...childIds], { updatedAt: new Date() });
  }

  async run(auth: AuthDto, dto: AssetJobsDto) {
    await this.access.requirePermission(auth, Permission.ASSET_UPDATE, dto.assetIds);

    const jobs: JobItem[] = [];

    for (const id of dto.assetIds) {
      switch (dto.name) {
        case AssetJobName.REFRESH_METADATA: {
          jobs.push({ name: JobName.METADATA_EXTRACTION, data: { id } });
          break;
        }

        case AssetJobName.REGENERATE_THUMBNAIL: {
          jobs.push({ name: JobName.GENERATE_PREVIEW, data: { id } });
          break;
        }

        case AssetJobName.TRANSCODE_VIDEO: {
          jobs.push({ name: JobName.VIDEO_CONVERSION, data: { id } });
          break;
        }
      }
    }

    await this.jobRepository.queueAll(jobs);
  }

  private async updateMetadata(dto: ISidecarWriteJob) {
    const { id, description, dateTimeOriginal, latitude, longitude } = dto;
    const writes = _.omitBy({ description, dateTimeOriginal, latitude, longitude }, _.isUndefined);
    if (Object.keys(writes).length > 0) {
      await this.assetRepository.upsertExif({ assetId: id, ...writes });
      await this.jobRepository.queue({ name: JobName.SIDECAR_WRITE, data: { id, ...writes } });
    }
  }
}
