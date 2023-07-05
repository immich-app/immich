import { AssetEntity, AssetType, LibraryEntity, UserEntity } from '@app/infra/entities';
import { BadRequestException, Inject } from '@nestjs/common';
import fs from 'fs';
import { DateTime } from 'luxon';
import mime from 'mime';
import { basename, extname, parse } from 'path';
import { AccessCore, IAccessRepository, Permission } from '../access';
import { AuthUserDto } from '../auth';
import { ICryptoRepository } from '../crypto';
import { isSupportedFileType } from '../domain.constant';
import { HumanReadableSize, usePagination } from '../domain.util';
import { IJobRepository, ILibraryJob, JobName } from '../job';
import { ImmichReadStream, IStorageRepository } from '../storage';
import { IAssetRepository } from './asset.repository';
import { AssetIdsDto, DownloadArchiveInfo, DownloadDto, DownloadResponseDto, MemoryLaneDto } from './dto';
import { MapMarkerDto } from './dto/map-marker.dto';
import { mapAsset, MapMarkerResponseDto } from './response-dto';
import { MemoryLaneResponseDto } from './response-dto/memory-lane-response.dto';

export class AssetService {
  private access: AccessCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
  ) {
    this.access = new AccessCore(accessRepository);
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

  async downloadFile(authUser: AuthUserDto, id: string): Promise<ImmichReadStream> {
    await this.access.requirePermission(authUser, Permission.ASSET_DOWNLOAD, id);

    const [asset] = await this.assetRepository.getByIds([id]);
    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    return this.storageRepository.createReadStream(asset.originalPath, asset.mimeType);
  }

  async getDownloadInfo(authUser: AuthUserDto, dto: DownloadDto): Promise<DownloadResponseDto> {
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

  private async getDownloadAssets(authUser: AuthUserDto, dto: DownloadDto): Promise<AsyncGenerator<AssetEntity[]>> {
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

  async handleRefreshAsset(job: ILibraryJob) {
    console.log('Refreshing file ' + job.assetPath);
    // TODO: Determine file type from extension only
    const mimeType = mime.lookup(job.assetPath);
    if (!mimeType) {
      throw Error(`Cannot determine mime type of asset: ${job.assetPath}`);
    }
    if (!isSupportedFileType(mimeType)) {
      throw new BadRequestException(`Unsupported file type ${mimeType}`);
    }

    const existingAssetEntity = await this.assetRepository.getByLibraryIdAndOriginalPath(job.libraryId, job.assetPath);

    let stats: fs.Stats;
    try {
      stats = await fs.promises.stat(job.assetPath);
    } catch (error) {
      // Can't access file, probably offline
      if (job.emptyTrash && existingAssetEntity) {
        // Remove asset from database
        await this.assetRepository.remove(existingAssetEntity);
        return true;
      } else if (existingAssetEntity) {
        // Mark asset as offline
        existingAssetEntity.isOffline = true;
        await this.assetRepository.save(existingAssetEntity);
        return true;
      } else {
        throw new BadRequestException(error, "Can't access file");
      }
    }

    if (existingAssetEntity && stats.mtime == existingAssetEntity.fileModifiedAt && !job.forceRefresh) {
      if (existingAssetEntity.isOffline) {
        // Asset is back online
        existingAssetEntity.isOffline = false;
        await this.assetRepository.save(existingAssetEntity);
      }
      // File last modified time matches database entry
      // Unless we're forcing a refresh, exit here
      return true;
    }

    const checksum = await this.cryptoRepository.hashFile(job.assetPath);
    const deviceAssetId = `${basename(job.assetPath)}-${stats.size}`.replace(/\s+/g, '');
    const assetType = mimeType.split('/')[0].toUpperCase() as AssetType;

    // TODO: doesn't xmp replace the file extension? Will need investigation
    let sidecarPath: string | null = null;
    try {
      fs.accessSync(`${job.assetPath}.xmp`, fs.constants.R_OK);
      sidecarPath = `${job.assetPath}.xmp`;
    } catch (error) {}

    // TODO: In wait of refactoring the domain asset service, this function is just manually written like this
    const addedAsset = await this.assetRepository.create({
      owner: { id: job.ownerId } as UserEntity,

      library: { id: job.libraryId } as LibraryEntity,

      mimeType: mimeType,
      checksum: checksum,
      originalPath: job.assetPath,

      deviceAssetId: deviceAssetId,
      deviceId: 'Library Import',

      fileCreatedAt: stats.ctime,
      fileModifiedAt: stats.mtime,

      type: assetType,
      isFavorite: false,
      isArchived: false,
      duration: null,
      isVisible: true,
      livePhotoVideo: null,
      resizePath: null,
      webpPath: null,
      thumbhash: null,
      encodedVideoPath: null,
      tags: [],
      sharedLinks: [],
      originalFileName: parse(job.assetPath).name,
      faces: [],
      sidecarPath: sidecarPath,
      isReadOnly: true,
      isOffline: false,
    });

    await this.jobRepository.queue({
      name: JobName.METADATA_EXTRACTION,
      data: { id: addedAsset.id, source: 'upload' },
    });
    if (addedAsset.type === AssetType.VIDEO) {
      await this.jobRepository.queue({ name: JobName.VIDEO_CONVERSION, data: { id: addedAsset.id } });
    }

    return true;
  }

  async handleOfflineAsset(job: ILibraryJob) {
    const existingAssetEntity = await this.assetRepository.getByLibraryIdAndOriginalPath(job.libraryId, job.assetPath);

    // Can't access file, probably offline
    if (job.emptyTrash && existingAssetEntity) {
      // Remove asset from database
      await this.assetRepository.remove(existingAssetEntity);
      console.log('Removed offline file ' + job.assetPath);
    } else if (existingAssetEntity) {
      // Mark asset as offline
      existingAssetEntity.isOffline = true;
      await this.assetRepository.save(existingAssetEntity);
    }

    return true;
  }
}
