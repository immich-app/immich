import { AssetEntity, LibraryType } from '@app/infra/entities';
import { ImmichLogger } from '@app/infra/logger';
import { BadRequestException, Inject } from '@nestjs/common';
import _ from 'lodash';
import { DateTime, Duration } from 'luxon';
import { extname } from 'path';
import sanitize from 'sanitize-filename';
import { AccessCore, Permission } from '../access';
import { AuthDto } from '../auth';
import { mimeTypes } from '../domain.constant';
import { HumanReadableSize, ImmichFileResponse, usePagination } from '../domain.util';
import { IAssetDeletionJob, ISidecarWriteJob, JOBS_ASSET_PAGINATION_SIZE, JobName } from '../job';
import {
  ClientEvent,
  IAccessRepository,
  IAssetRepository,
  ICommunicationRepository,
  ICryptoRepository,
  IJobRepository,
  IPartnerRepository,
  IStorageRepository,
  ISystemConfigRepository,
  ImmichReadStream,
  TimeBucketOptions,
} from '../repositories';
import { StorageCore, StorageFolder } from '../storage';
import { SystemConfigCore } from '../system-config';
import {
  AssetBulkDeleteDto,
  AssetBulkUpdateDto,
  AssetIdsDto,
  AssetJobName,
  AssetJobsDto,
  AssetOrder,
  AssetSearchDto,
  AssetStatsDto,
  DownloadArchiveInfo,
  DownloadInfoDto,
  DownloadResponseDto,
  MapMarkerDto,
  MemoryLaneDto,
  TimeBucketAssetDto,
  TimeBucketDto,
  TrashAction,
  UpdateAssetDto,
  UpdateStackParentDto,
  mapStats,
} from './dto';
import {
  AssetResponseDto,
  BulkIdsDto,
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
  checksum: Buffer;
  originalPath: string;
  originalName: string;
}

export class AssetService {
  private logger = new ImmichLogger(AssetService.name);
  private access: AccessCore;
  private configCore: SystemConfigCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(ICommunicationRepository) private communicationRepository: ICommunicationRepository,
    @Inject(IPartnerRepository) private partnerRepository: IPartnerRepository,
  ) {
    this.access = AccessCore.create(accessRepository);
    this.configCore = SystemConfigCore.create(configRepository);
  }

  search(auth: AuthDto, dto: AssetSearchDto) {
    let checksum: Buffer | undefined = undefined;

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
      case UploadFieldName.ASSET_DATA:
        if (mimeTypes.isAsset(filename)) {
          return true;
        }
        break;

      case UploadFieldName.LIVE_PHOTO_DATA:
        if (mimeTypes.isVideo(filename)) {
          return true;
        }
        break;

      case UploadFieldName.SIDECAR_DATA:
        if (mimeTypes.isSidecar(filename)) {
          return true;
        }
        break;

      case UploadFieldName.PROFILE_DATA:
        if (mimeTypes.isProfile(filename)) {
          return true;
        }
        break;
    }

    this.logger.error(`Unsupported file type ${filename}`);
    throw new BadRequestException(`Unsupported file type ${filename}`);
  }

  getUploadFilename({ auth, fieldName, file }: UploadRequest): string {
    this.access.requireUploadAccess(auth);

    const originalExt = extname(file.originalName);

    const lookup = {
      [UploadFieldName.ASSET_DATA]: originalExt,
      [UploadFieldName.LIVE_PHOTO_DATA]: '.mov',
      [UploadFieldName.SIDECAR_DATA]: '.xmp',
      [UploadFieldName.PROFILE_DATA]: originalExt,
    };

    return sanitize(`${this.cryptoRepository.randomUUID()}${lookup[fieldName]}`);
  }

  getUploadFolder({ auth, fieldName }: UploadRequest): string {
    auth = this.access.requireUploadAccess(auth);

    let folder = StorageCore.getFolderLocation(StorageFolder.UPLOAD, auth.user.id);
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
    if (!auth.sharedLink || auth.sharedLink?.showExif) {
      return assets.map((asset) => mapAsset(asset, { withStack: true }));
    } else {
      return assets.map((asset) => mapAsset(asset, { stripMetadata: true }));
    }
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
  async downloadFile(auth: AuthDto, id: string): Promise<ImmichFileResponse> {
    await this.access.requirePermission(auth, Permission.ASSET_DOWNLOAD, id);

    const [asset] = await this.assetRepository.getByIds([id]);
    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    if (asset.isOffline) {
      throw new BadRequestException('Asset is offline');
    }

    return new ImmichFileResponse({
      path: asset.originalPath,
      contentType: mimeTypes.lookup(asset.originalPath),
      cacheControl: false,
    });
  }

  async getDownloadInfo(auth: AuthDto, dto: DownloadInfoDto): Promise<DownloadResponseDto> {
    const targetSize = dto.archiveSize || HumanReadableSize.GiB * 4;
    const archives: DownloadArchiveInfo[] = [];
    let archive: DownloadArchiveInfo = { size: 0, assetIds: [] };

    const assetPagination = await this.getDownloadAssets(auth, dto);
    for await (const assets of assetPagination) {
      // motion part of live photos
      const motionIds = assets.map((asset) => asset.livePhotoVideoId).filter<string>((id): id is string => !!id);
      if (motionIds.length > 0) {
        assets.push(...(await this.assetRepository.getByIds(motionIds)));
      }

      for (const asset of assets) {
        archive.size += Number(asset.exifInfo?.fileSizeInByte || 0);
        archive.assetIds.push(asset.id);

        if (archive.size > targetSize) {
          archives.push(archive);
          archive = { size: 0, assetIds: [] };
        }
      }

      if (archive.assetIds.length > 0) {
        archives.push(archive);
      }
    }

    return {
      totalSize: archives.reduce((total, item) => (total += item.size), 0),
      archives,
    };
  }

  async downloadArchive(auth: AuthDto, dto: AssetIdsDto): Promise<ImmichReadStream> {
    await this.access.requirePermission(auth, Permission.ASSET_DOWNLOAD, dto.assetIds);

    const zip = this.storageRepository.createZipStream();
    const assets = await this.assetRepository.getByIds(dto.assetIds);
    const paths: Record<string, number> = {};

    for (const { originalPath, originalFileName } of assets) {
      const ext = extname(originalPath);
      let filename = `${originalFileName}${ext}`;
      const count = paths[filename] || 0;
      paths[filename] = count + 1;
      if (count !== 0) {
        filename = `${originalFileName}+${count}${ext}`;
      }

      zip.addFile(originalPath, filename);
    }

    void zip.finalize();

    return { stream: zip.stream };
  }

  private async getDownloadAssets(auth: AuthDto, dto: DownloadInfoDto): Promise<AsyncGenerator<AssetEntity[]>> {
    const PAGINATION_SIZE = 2500;

    if (dto.assetIds) {
      const assetIds = dto.assetIds;
      await this.access.requirePermission(auth, Permission.ASSET_DOWNLOAD, assetIds);
      const assets = await this.assetRepository.getByIds(assetIds);
      return (async function* () {
        yield assets;
      })();
    }

    if (dto.albumId) {
      const albumId = dto.albumId;
      await this.access.requirePermission(auth, Permission.ALBUM_DOWNLOAD, albumId);
      return usePagination(PAGINATION_SIZE, (pagination) => this.assetRepository.getByAlbumId(pagination, albumId));
    }

    if (dto.userId) {
      const userId = dto.userId;
      await this.access.requirePermission(auth, Permission.TIMELINE_DOWNLOAD, userId);
      return usePagination(PAGINATION_SIZE, (pagination) =>
        this.assetRepository.getByUserId(pagination, userId, { isVisible: true }),
      );
    }

    throw new BadRequestException('assetIds, albumId, or userId is required');
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

    if (removeParent) {
      (options as Partial<AssetEntity>).stackParentId = null;
      const assets = await this.assetRepository.getByIds(ids);
      // This updates the updatedAt column of the parents to indicate that one of its children is removed
      // All the unique parent's -> parent is set to null
      ids.push(...new Set(assets.filter((a) => !!a.stackParentId).map((a) => a.stackParentId!)));
    } else if (options.stackParentId) {
      await this.access.requirePermission(auth, Permission.ASSET_UPDATE, options.stackParentId);
      // Merge stacks
      const assets = await this.assetRepository.getByIds(ids);
      const assetsWithChildren = assets.filter((a) => a.stack && a.stack.length > 0);
      ids.push(...assetsWithChildren.flatMap((child) => child.stack!.map((gChild) => gChild.id)));

      // This updates the updatedAt column of the parent to indicate that a new child has been added
      await this.assetRepository.updateAll([options.stackParentId], { stackParentId: null });
    }

    for (const id of ids) {
      await this.updateMetadata({ id, dateTimeOriginal, latitude, longitude });
    }

    for (const id of ids) {
      await this.updateMetadata({ id, dateTimeOriginal, latitude, longitude });
    }

    await this.assetRepository.updateAll(ids, options);
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
      for (const asset of assets) {
        await this.jobRepository.queue({ name: JobName.ASSET_DELETION, data: { id: asset.id } });
      }
    }

    return true;
  }

  async handleAssetDeletion(job: IAssetDeletionJob) {
    const { id, fromExternal } = job;

    const asset = await this.assetRepository.getById(id);
    if (!asset) {
      return false;
    }

    // Ignore requests that are not from external library job but is for an external asset
    if (!fromExternal && (!asset.library || asset.library.type === LibraryType.EXTERNAL)) {
      return false;
    }

    // Replace the parent of the stack children with a new asset
    if (asset.stack && asset.stack.length != 0) {
      const stackIds = asset.stack.map((a) => a.id);
      const newParentId = stackIds[0];
      await this.assetRepository.updateAll(stackIds.slice(1), { stackParentId: newParentId });
      await this.assetRepository.updateAll([newParentId], { stackParentId: null });
    }

    await this.assetRepository.remove(asset);
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
      for (const id of ids) {
        await this.jobRepository.queue({ name: JobName.ASSET_DELETION, data: { id } });
      }
    } else {
      await this.assetRepository.softDeleteAll(ids);
      this.communicationRepository.send(ClientEvent.ASSET_TRASH, auth.user.id, ids);
    }
  }

  async handleTrashAction(auth: AuthDto, action: TrashAction): Promise<void> {
    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) =>
      this.assetRepository.getByUserId(pagination, auth.user.id, { trashedBefore: DateTime.now().toJSDate() }),
    );

    if (action == TrashAction.RESTORE_ALL) {
      for await (const assets of assetPagination) {
        const ids = assets.map((a) => a.id);
        await this.assetRepository.restoreAll(ids);
        this.communicationRepository.send(ClientEvent.ASSET_RESTORE, auth.user.id, ids);
      }
      return;
    }

    if (action == TrashAction.EMPTY_ALL) {
      for await (const assets of assetPagination) {
        for (const asset of assets) {
          await this.jobRepository.queue({ name: JobName.ASSET_DELETION, data: { id: asset.id } });
        }
      }
      return;
    }
  }

  async restoreAll(auth: AuthDto, dto: BulkIdsDto): Promise<void> {
    const { ids } = dto;
    await this.access.requirePermission(auth, Permission.ASSET_RESTORE, ids);
    await this.assetRepository.restoreAll(ids);
    this.communicationRepository.send(ClientEvent.ASSET_RESTORE, auth.user.id, ids);
  }

  async updateStackParent(auth: AuthDto, dto: UpdateStackParentDto): Promise<void> {
    const { oldParentId, newParentId } = dto;
    await this.access.requirePermission(auth, Permission.ASSET_READ, oldParentId);
    await this.access.requirePermission(auth, Permission.ASSET_UPDATE, newParentId);

    const childIds: string[] = [];
    const oldParent = await this.assetRepository.getById(oldParentId);
    if (oldParent != null) {
      childIds.push(oldParent.id);
      // Get all children of old parent
      childIds.push(...(oldParent.stack?.map((a) => a.id) ?? []));
    }

    this.communicationRepository.send(ClientEvent.ASSET_UPDATE, auth.user.id, [...childIds, newParentId]);
    await this.assetRepository.updateAll(childIds, { stackParentId: newParentId });
    // Remove ParentId of new parent if this was previously a child of some other asset
    return this.assetRepository.updateAll([newParentId], { stackParentId: null });
  }

  async run(auth: AuthDto, dto: AssetJobsDto) {
    await this.access.requirePermission(auth, Permission.ASSET_UPDATE, dto.assetIds);

    for (const id of dto.assetIds) {
      switch (dto.name) {
        case AssetJobName.REFRESH_METADATA:
          await this.jobRepository.queue({ name: JobName.METADATA_EXTRACTION, data: { id } });
          break;

        case AssetJobName.REGENERATE_THUMBNAIL:
          await this.jobRepository.queue({ name: JobName.GENERATE_JPEG_THUMBNAIL, data: { id } });
          break;

        case AssetJobName.TRANSCODE_VIDEO:
          await this.jobRepository.queue({ name: JobName.VIDEO_CONVERSION, data: { id } });
          break;
      }
    }
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
