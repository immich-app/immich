import { AssetEntity } from '@app/infra/entities';
import { BadRequestException, Inject, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { extname } from 'path';
import sanitize from 'sanitize-filename';
import { AccessCore, IAccessRepository, Permission } from '../access';
import { AuthUserDto } from '../auth';
import { ICryptoRepository } from '../crypto';
import { mimeTypes } from '../domain.constant';
import { HumanReadableSize, usePagination } from '../domain.util';
import { IJobRepository, JobName } from '../job';
import { ImmichReadStream, IStorageRepository, StorageCore, StorageFolder } from '../storage';
import { IAssetRepository } from './asset.repository';
import {
  AssetBulkUpdateDto,
  AssetIdsDto,
  AssetJobName,
  AssetJobsDto,
  DownloadArchiveInfo,
  DownloadInfoDto,
  DownloadResponseDto,
  MemoryLaneDto,
  TimeBucketAssetDto,
  TimeBucketDto,
} from './dto';
import { AssetStatsDto, mapStats } from './dto/asset-statistics.dto';
import { MapMarkerDto } from './dto/map-marker.dto';
import { AssetResponseDto, mapAsset, MapMarkerResponseDto } from './response-dto';
import { MemoryLaneResponseDto } from './response-dto/memory-lane-response.dto';
import { TimeBucketResponseDto } from './response-dto/time-bucket-response.dto';

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
  private storageCore = new StorageCore();

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
  ) {
    this.access = new AccessCore(accessRepository);
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
    const target = DateTime.fromJSDate(dto.timestamp);

    const onRequest = async (yearsAgo: number): Promise<MemoryLaneResponseDto> => {
      const assets = await this.assetRepository.getByDate(authUser.id, target.minus({ years: yearsAgo }).toJSDate());
      return {
        title: `${yearsAgo} year${yearsAgo > 1 ? 's' : ''} since...`,
        assets: assets.map((a) => mapAsset(a)),
      };
    };

    const requests: Promise<MemoryLaneResponseDto>[] = [];
    for (let i = 1; i <= dto.years; i++) {
      requests.push(onRequest(i));
    }

    return Promise.all(requests).then((results) => results.filter((result) => result.assets.length > 0));
  }

  private async timeBucketChecks(authUser: AuthUserDto, dto: TimeBucketDto) {
    if (dto.albumId) {
      await this.access.requirePermission(authUser, Permission.ALBUM_READ, [dto.albumId]);
    } else if (dto.userId) {
      if (dto.isArchived !== false) {
        await this.access.requirePermission(authUser, Permission.ARCHIVE_READ, [dto.userId]);
      }
      await this.access.requirePermission(authUser, Permission.LIBRARY_READ, [dto.userId]);
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
      await this.access.requirePermission(authUser, Permission.LIBRARY_DOWNLOAD, userId);
      return usePagination(PAGINATION_SIZE, (pagination) => this.assetRepository.getByUserId(pagination, userId));
    }

    throw new BadRequestException('assetIds, albumId, or userId is required');
  }

  async getStatistics(authUser: AuthUserDto, dto: AssetStatsDto) {
    const stats = await this.assetRepository.getStatistics(authUser.id, dto);
    return mapStats(stats);
  }

  async updateAll(authUser: AuthUserDto, dto: AssetBulkUpdateDto) {
    const { ids, ...options } = dto;
    await this.access.requirePermission(authUser, Permission.ASSET_UPDATE, ids);
    await this.assetRepository.updateAll(ids, options);
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
