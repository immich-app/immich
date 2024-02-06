import { AssetEntity, LibraryType } from '@app/infra/entities';
import { ImmichLogger } from '@app/infra/logger';
import { BadRequestException, Inject } from '@nestjs/common';
import _ from 'lodash';
import { DateTime, Duration } from 'luxon';
import { extname } from 'node:path';
import sanitize from 'sanitize-filename';
import { AccessCore, Permission } from '../access';
import { AuthDto } from '../auth';
import { mimeTypes } from '../domain.constant';
import { usePagination } from '../domain.util';
import { IAssetDeletionJob, ISidecarWriteJob, JOBS_ASSET_PAGINATION_SIZE, JobName } from '../job';
import {
  ClientEvent,
  IAccessRepository,
  IAssetRepository,
  IAssetStackRepository,
  ICommunicationRepository,
  IJobRepository,
  IPartnerRepository,
  IStorageRepository,
  ISystemConfigRepository,
  IUserRepository,
  JobItem,
  TimeBucketOptions,
} from '../repositories';
import { StorageCore, StorageFolder } from '../storage';
import { SystemConfigCore } from '../system-config';
import {
  AssetBulkDeleteDto,
  AssetBulkUpdateDto,
  AssetJobName,
  AssetJobsDto,
  AssetOrder,
  AssetSearchDto,
  AssetStatsDto,
  MapMarkerDto,
  MemoryLaneDto,
  TimeBucketAssetDto,
  TimeBucketDto,
  UpdateAssetDto,
  UpdateStackParentDto,
  mapStats,
} from './dto';
import {
  AssetResponseDto,
  MapMarkerResponseDto,
  MemoryLaneResponseDto,
  SanitizedAssetResponseDto,
  TimeBucketResponseDto,
  mapAsset,
} from './response-dto';

export enum UploadFieldName {
  ASSET_DATA = 'assetData',
  LIVE_PHOTO_DATA = 'livePhotoData',
  SIDECAR_DATA = 'sidecarData',
  PROFILE_DATA = 'file',
}

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
  private logger = new ImmichLogger(AssetService.name);
  private access: AccessCore;
  private configCore: SystemConfigCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(ICommunicationRepository) private communicationRepository: ICommunicationRepository,
    @Inject(IPartnerRepository) private partnerRepository: IPartnerRepository,
    @Inject(IAssetStackRepository) private assetStackRepository: IAssetStackRepository,
  ) {
    this.access = AccessCore.create(accessRepository);
    this.configCore = SystemConfigCore.create(configRepository);
  }

  search(auth: AuthDto, dto: AssetSearchDto) {
    let checksum: Buffer | undefined;

    if (dto.checksum) {
      const encoding = dto.checksum.length === 28 ? 'base64' : 'hex';
      checksum = Buffer.from(dto.checksum, encoding);
    }

    const enumToOrder = { [AssetOrder.ASC]: 'ASC', [AssetOrder.DESC]: 'DESC' } as const;
    const order = dto.order ? enumToOrder[dto.order] : undefined;

    return this.assetRepository
      .search({
        ...dto,
        order,
        checksum,
        ownerId: auth.user.id,
      })
      .then((assets) =>
        assets.map((asset) =>
          mapAsset(asset, {
            stripMetadata: false,
            withStack: true,
          }),
        ),
      );
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

  getMapMarkers(auth: AuthDto, options: MapMarkerDto): Promise<MapMarkerResponseDto[]> {
    return this.assetRepository.getMapMarkers(auth.user.id, options);
  }

  async getMemoryLane(auth: AuthDto, dto: MemoryLaneDto): Promise<MemoryLaneResponseDto[]> {
    const currentYear = new Date().getFullYear();
    const assets = await this.assetRepository.getByDayOfYear(auth.user.id, dto);

    return _.chain(assets)
      .filter((asset) => asset.localDateTime.getFullYear() < currentYear)
      .map((asset) => {
        const years = currentYear - asset.localDateTime.getFullYear();

        return {
          title: `${years} year${years > 1 ? 's' : ''} since...`,
          asset: mapAsset(asset),
        };
      })
      .groupBy((asset) => asset.title)
      .map((items, title) => ({ title, assets: items.map(({ asset }) => asset) }))
      .value();
  }

  private async timeBucketChecks(auth: AuthDto, dto: TimeBucketDto) {
    if (dto.albumId) {
      await this.access.requirePermission(auth, Permission.ALBUM_READ, [dto.albumId]);
    } else {
      dto.userId = dto.userId || auth.user.id;
    }

    if (dto.userId) {
      await this.access.requirePermission(auth, Permission.TIMELINE_READ, [dto.userId]);
      if (dto.isArchived !== false) {
        await this.access.requirePermission(auth, Permission.ARCHIVE_READ, [dto.userId]);
      }
    }

    if (dto.withPartners) {
      const requestedArchived = dto.isArchived === true || dto.isArchived === undefined;
      const requestedFavorite = dto.isFavorite === true || dto.isFavorite === false;
      const requestedTrash = dto.isTrashed === true;

      if (requestedArchived || requestedFavorite || requestedTrash) {
        throw new BadRequestException(
          'withPartners is only supported for non-archived, non-trashed, non-favorited assets',
        );
      }
    }
  }

  async getTimeBuckets(auth: AuthDto, dto: TimeBucketDto): Promise<TimeBucketResponseDto[]> {
    await this.timeBucketChecks(auth, dto);
    const timeBucketOptions = await this.buildTimeBucketOptions(auth, dto);

    return this.assetRepository.getTimeBuckets(timeBucketOptions);
  }

  async getTimeBucket(
    auth: AuthDto,
    dto: TimeBucketAssetDto,
  ): Promise<AssetResponseDto[] | SanitizedAssetResponseDto[]> {
    await this.timeBucketChecks(auth, dto);
    const timeBucketOptions = await this.buildTimeBucketOptions(auth, dto);
    const assets = await this.assetRepository.getTimeBucket(dto.timeBucket, timeBucketOptions);
    return !auth.sharedLink || auth.sharedLink?.showExif
      ? assets.map((asset) => mapAsset(asset, { withStack: true }))
      : assets.map((asset) => mapAsset(asset, { stripMetadata: true }));
  }

  async buildTimeBucketOptions(auth: AuthDto, dto: TimeBucketDto): Promise<TimeBucketOptions> {
    const { userId, ...options } = dto;
    let userIds: string[] | undefined = undefined;

    if (userId) {
      userIds = [userId];

      if (dto.withPartners) {
        const partners = await this.partnerRepository.getAll(auth.user.id);
        const partnersIds = partners
          .filter((partner) => partner.sharedBy && partner.sharedWith && partner.inTimeline)
          .map((partner) => partner.sharedById);

        userIds.push(...partnersIds);
      }
    }

    return { ...options, userIds };
  }

  async getStatistics(auth: AuthDto, dto: AssetStatsDto) {
    const stats = await this.assetRepository.getStatistics(auth.user.id, dto);
    return mapStats(stats);
  }

  async getRandom(auth: AuthDto, count: number): Promise<AssetResponseDto[]> {
    const assets = await this.assetRepository.getRandom(auth.user.id, count);
    return assets.map((a) => mapAsset(a));
  }

  async getUserAssetsByDeviceId(auth: AuthDto, deviceId: string) {
    return this.assetRepository.getAllByDeviceId(auth.user.id, deviceId);
  }

  async get(auth: AuthDto, id: string): Promise<AssetResponseDto | SanitizedAssetResponseDto> {
    await this.access.requirePermission(auth, Permission.ASSET_READ, id);

    const asset = await this.assetRepository.getById(id, {
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
    });

    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    if (auth.sharedLink && !auth.sharedLink.showExif) {
      return mapAsset(asset, { stripMetadata: true, withStack: true });
    }

    const data = mapAsset(asset, { withStack: true });

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

    const asset = await this.assetRepository.save({ id, ...rest });
    return mapAsset(asset);
  }

  async updateAll(auth: AuthDto, dto: AssetBulkUpdateDto): Promise<void> {
    const { ids, removeParent, dateTimeOriginal, latitude, longitude, ...options } = dto;
    await this.access.requirePermission(auth, Permission.ASSET_UPDATE, ids);

    // TODO: refactor this logic into separate API calls POST /stack, PUT /stack, etc.
    const stackIdsToCheckForDelete: string[] = [];
    if (removeParent) {
      (options as Partial<AssetEntity>).stack = null;
      const assets = await this.assetRepository.getByIds(ids);
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
    this.communicationRepository.send(ClientEvent.ASSET_UPDATE, auth.user.id, ids);
  }

  async handleAssetDeletionCheck() {
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

    return true;
  }

  async handleAssetDeletion(job: IAssetDeletionJob) {
    const { id, fromExternal } = job;

    const asset = await this.assetRepository.getById(id, {
      faces: {
        person: true,
      },
      library: true,
      stack: { assets: true },
      exifInfo: true,
    });

    if (!asset) {
      return false;
    }

    // Ignore requests that are not from external library job but is for an external asset
    if (!fromExternal && (!asset.library || asset.library.type === LibraryType.EXTERNAL)) {
      return false;
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
    await this.userRepository.updateUsage(asset.ownerId, -(asset.exifInfo?.fileSizeInByte || 0));
    this.communicationRepository.send(ClientEvent.ASSET_DELETE, asset.ownerId, id);

    // TODO refactor this to use cascades
    if (asset.livePhotoVideoId) {
      await this.jobRepository.queue({ name: JobName.ASSET_DELETION, data: { id: asset.livePhotoVideoId } });
    }

    const files = [asset.webpPath, asset.resizePath, asset.encodedVideoPath, asset.sidecarPath];
    if (!fromExternal) {
      files.push(asset.originalPath);
    }

    if (!asset.isReadOnly) {
      await this.jobRepository.queue({ name: JobName.DELETE_FILES, data: { files } });
    }

    return true;
  }

  async deleteAll(auth: AuthDto, dto: AssetBulkDeleteDto): Promise<void> {
    const { ids, force } = dto;

    await this.access.requirePermission(auth, Permission.ASSET_DELETE, ids);

    if (force) {
      await this.jobRepository.queueAll(ids.map((id) => ({ name: JobName.ASSET_DELETION, data: { id } })));
    } else {
      await this.assetRepository.softDeleteAll(ids);
      this.communicationRepository.send(ClientEvent.ASSET_TRASH, auth.user.id, ids);
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

    this.communicationRepository.send(ClientEvent.ASSET_UPDATE, auth.user.id, [...childIds, newParentId, oldParentId]);
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
          jobs.push({ name: JobName.GENERATE_JPEG_THUMBNAIL, data: { id } });
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
