import { AssetEntity, LibraryType } from '@app/infra/entities';
import { BadRequestException, Inject, Logger } from '@nestjs/common';
import _ from 'lodash';
import { DateTime, Duration } from 'luxon';
import { extname } from 'path';
import sanitize from 'sanitize-filename';
import { AccessCore, IAccessRepository, Permission } from '../access';
import { AuthUserDto } from '../auth';
import { ICryptoRepository } from '../crypto';
import { mimeTypes } from '../domain.constant';
import { HumanReadableSize, usePagination } from '../domain.util';
import { IAssetDeletionJob, IJobRepository, JOBS_ASSET_PAGINATION_SIZE, JobName } from '../job';
import { IStorageRepository, ImmichReadStream, StorageCore, StorageFolder } from '../storage';
import { ISystemConfigRepository, SystemConfigCore } from '../system-config';
import { IAssetRepository } from './asset.repository';
import {
  AssetBulkDeleteDto,
  AssetBulkUpdateDto,
  AssetIdsDto,
  AssetJobName,
  AssetJobsDto,
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
  mapStats,
} from './dto';
import {
  AssetResponseDto,
  BulkIdsDto,
  MapMarkerResponseDto,
  MemoryLaneResponseDto,
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
  authUser: AuthUserDto | null;
  fieldName: UploadFieldName;
  file: UploadFile;
}

export interface UploadFile {
  checksum: Buffer;
  originalPath: string;
  originalName: string;
}

export class AssetService {
  private logger = new Logger(AssetService.name);
  private access: AccessCore;
  private configCore: SystemConfigCore;
  private storageCore: StorageCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
  ) {
    this.access = new AccessCore(accessRepository);
    this.storageCore = new StorageCore(storageRepository);
    this.configCore = new SystemConfigCore(configRepository);
  }

  canUploadFile({ authUser, fieldName, file }: UploadRequest): true {
    this.access.requireUploadAccess(authUser);

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

  getUploadFilename({ authUser, fieldName, file }: UploadRequest): string {
    this.access.requireUploadAccess(authUser);

    const originalExt = extname(file.originalName);

    const lookup = {
      [UploadFieldName.ASSET_DATA]: originalExt,
      [UploadFieldName.LIVE_PHOTO_DATA]: '.mov',
      [UploadFieldName.SIDECAR_DATA]: '.xmp',
      [UploadFieldName.PROFILE_DATA]: originalExt,
    };

    return sanitize(`${this.cryptoRepository.randomUUID()}${lookup[fieldName]}`);
  }

  getUploadFolder({ authUser, fieldName }: UploadRequest): string {
    authUser = this.access.requireUploadAccess(authUser);

    let folder = this.storageCore.getFolderLocation(StorageFolder.UPLOAD, authUser.id);
    if (fieldName === UploadFieldName.PROFILE_DATA) {
      folder = this.storageCore.getFolderLocation(StorageFolder.PROFILE, authUser.id);
    }

    this.storageRepository.mkdirSync(folder);

    return folder;
  }

  getMapMarkers(authUser: AuthUserDto, options: MapMarkerDto): Promise<MapMarkerResponseDto[]> {
    return this.assetRepository.getMapMarkers(authUser.id, options);
  }

  async getMemoryLane(authUser: AuthUserDto, dto: MemoryLaneDto): Promise<MemoryLaneResponseDto[]> {
    const currentYear = new Date().getFullYear();
    const assets = await this.assetRepository.getByDayOfYear(authUser.id, dto);

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

  private async timeBucketChecks(authUser: AuthUserDto, dto: TimeBucketDto) {
    if (dto.albumId) {
      await this.access.requirePermission(authUser, Permission.ALBUM_READ, [dto.albumId]);
    } else if (dto.userId) {
      if (dto.isArchived !== false) {
        await this.access.requirePermission(authUser, Permission.ARCHIVE_READ, [dto.userId]);
      }
      await this.access.requirePermission(authUser, Permission.TIMELINE_READ, [dto.userId]);
    } else {
      dto.userId = authUser.id;
    }
  }

  async getTimeBuckets(authUser: AuthUserDto, dto: TimeBucketDto): Promise<TimeBucketResponseDto[]> {
    await this.timeBucketChecks(authUser, dto);
    return this.assetRepository.getTimeBuckets(dto);
  }

  async getByTimeBucket(authUser: AuthUserDto, dto: TimeBucketAssetDto): Promise<AssetResponseDto[]> {
    await this.timeBucketChecks(authUser, dto);
    const assets = await this.assetRepository.getByTimeBucket(dto.timeBucket, dto);
    return assets.map(mapAsset);
  }

  async downloadFile(authUser: AuthUserDto, id: string): Promise<ImmichReadStream> {
    await this.access.requirePermission(authUser, Permission.ASSET_DOWNLOAD, id);

    const [asset] = await this.assetRepository.getByIds([id]);
    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    if (asset.isOffline) {
      throw new BadRequestException('Asset is offline');
    }

    return this.storageRepository.createReadStream(asset.originalPath, mimeTypes.lookup(asset.originalPath));
  }

  async getDownloadInfo(authUser: AuthUserDto, dto: DownloadInfoDto): Promise<DownloadResponseDto> {
    const targetSize = dto.archiveSize || HumanReadableSize.GiB * 4;
    const archives: DownloadArchiveInfo[] = [];
    let archive: DownloadArchiveInfo = { size: 0, assetIds: [] };

    const assetPagination = await this.getDownloadAssets(authUser, dto);
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

  async downloadArchive(authUser: AuthUserDto, dto: AssetIdsDto): Promise<ImmichReadStream> {
    await this.access.requirePermission(authUser, Permission.ASSET_DOWNLOAD, dto.assetIds);

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

    zip.finalize();

    return { stream: zip.stream };
  }

  private async getDownloadAssets(authUser: AuthUserDto, dto: DownloadInfoDto): Promise<AsyncGenerator<AssetEntity[]>> {
    const PAGINATION_SIZE = 2500;

    if (dto.assetIds) {
      const assetIds = dto.assetIds;
      await this.access.requirePermission(authUser, Permission.ASSET_DOWNLOAD, assetIds);
      const assets = await this.assetRepository.getByIds(assetIds);
      return (async function* () {
        yield assets;
      })();
    }

    if (dto.albumId) {
      const albumId = dto.albumId;
      await this.access.requirePermission(authUser, Permission.ALBUM_DOWNLOAD, albumId);
      return usePagination(PAGINATION_SIZE, (pagination) => this.assetRepository.getByAlbumId(pagination, albumId));
    }

    if (dto.userId) {
      const userId = dto.userId;
      await this.access.requirePermission(authUser, Permission.TIMELINE_DOWNLOAD, userId);
      return usePagination(PAGINATION_SIZE, (pagination) =>
        this.assetRepository.getByUserId(pagination, userId, { isVisible: true }),
      );
    }

    throw new BadRequestException('assetIds, albumId, or userId is required');
  }

  async getStatistics(authUser: AuthUserDto, dto: AssetStatsDto) {
    const stats = await this.assetRepository.getStatistics(authUser.id, dto);
    return mapStats(stats);
  }

  async getRandom(authUser: AuthUserDto, count: number): Promise<AssetResponseDto[]> {
    const assets = await this.assetRepository.getRandom(authUser.id, count);
    return assets.map((a) => mapAsset(a));
  }

  async update(authUser: AuthUserDto, id: string, dto: UpdateAssetDto): Promise<AssetResponseDto> {
    await this.access.requirePermission(authUser, Permission.ASSET_UPDATE, id);

    const { description, ...rest } = dto;
    if (description !== undefined) {
      await this.assetRepository.upsertExif({ assetId: id, description });
    }

    const asset = await this.assetRepository.save({ id, ...rest });
    await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_ASSET, data: { ids: [id] } });
    return mapAsset(asset);
  }

  async updateAll(authUser: AuthUserDto, dto: AssetBulkUpdateDto): Promise<void> {
    const { ids, ...options } = dto;
    await this.access.requirePermission(authUser, Permission.ASSET_UPDATE, ids);
    await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_ASSET, data: { ids } });
    await this.assetRepository.updateAll(ids, options);
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

    if (asset.faces) {
      await Promise.all(
        asset.faces.map(({ assetId, personId }) =>
          this.jobRepository.queue({ name: JobName.SEARCH_REMOVE_FACE, data: { assetId, personId } }),
        ),
      );
    }

    await this.assetRepository.remove(asset);
    await this.jobRepository.queue({ name: JobName.SEARCH_REMOVE_ASSET, data: { ids: [asset.id] } });

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

  async deleteAll(authUser: AuthUserDto, dto: AssetBulkDeleteDto): Promise<void> {
    const { ids, force } = dto;

    await this.access.requirePermission(authUser, Permission.ASSET_DELETE, ids);

    if (force) {
      for (const id of ids) {
        await this.jobRepository.queue({ name: JobName.ASSET_DELETION, data: { id } });
      }
    } else {
      await this.assetRepository.softDeleteAll(ids);
      await this.jobRepository.queue({ name: JobName.SEARCH_REMOVE_ASSET, data: { ids } });
    }
  }

  async handleTrashAction(authUser: AuthUserDto, action: TrashAction): Promise<void> {
    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) =>
      this.assetRepository.getByUserId(pagination, authUser.id, { trashedBefore: DateTime.now().toJSDate() }),
    );

    if (action == TrashAction.RESTORE_ALL) {
      for await (const assets of assetPagination) {
        const ids = assets.map((a) => a.id);
        await this.assetRepository.restoreAll(ids);
        await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_ASSET, data: { ids } });
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

  async restoreAll(authUser: AuthUserDto, dto: BulkIdsDto): Promise<void> {
    const { ids } = dto;
    await this.access.requirePermission(authUser, Permission.ASSET_RESTORE, ids);
    await this.assetRepository.restoreAll(ids);
    await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_ASSET, data: { ids } });
  }

  async run(authUser: AuthUserDto, dto: AssetJobsDto) {
    await this.access.requirePermission(authUser, Permission.ASSET_UPDATE, dto.assetIds);

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
}
