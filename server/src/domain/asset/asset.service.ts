import { BadRequestException, Inject } from '@nestjs/common';
import { DateTime } from 'luxon';
import { extname } from 'path';
import { AssetEntity } from '../../infra/entities/asset.entity';
import { AuthUserDto } from '../auth';
import { HumanReadableSize, usePagination } from '../domain.util';
import { AccessCore, IAccessRepository, Permission } from '../index';
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
    const MAX_ARCHIVE_FILES = 1000;
    const MAX_ARCHIVE_SIZE = HumanReadableSize.MiB * 500;
    const PAGE_SIZE = 1000;

    let assetPagination: AsyncGenerator<AssetEntity[]> | null = null;

    if (dto.assetIds) {
      const assetIds = dto.assetIds;
      await this.access.requirePermission(authUser, Permission.ASSET_DOWNLOAD, assetIds);
      const assets = await this.assetRepository.getByIds(assetIds);
      assetPagination = (async function* () {
        yield assets;
      })();
    }

    if (dto.albumId) {
      const albumId = dto.albumId;
      await this.access.requirePermission(authUser, Permission.ALBUM_DOWNLOAD, albumId);
      assetPagination = usePagination(PAGE_SIZE, (pagination) =>
        this.assetRepository.getByAlbumId(pagination, albumId),
      );
    }

    if (dto.userId) {
      const userId = dto.userId;
      await this.access.requirePermission(authUser, Permission.LIBRARY_DOWNLOAD, userId);
      assetPagination = usePagination(PAGE_SIZE, (pagination) => this.assetRepository.getByUserId(pagination, userId));
    }

    if (!assetPagination) {
      throw new BadRequestException('No assets');
    }

    const archives: DownloadArchiveInfo[] = [];
    let archive: DownloadArchiveInfo = { size: 0, assetIds: [] };

    for await (const assets of assetPagination) {
      // motion part of live photos
      const motionIds = assets.map((asset) => asset.livePhotoVideoId).filter<string>((id): id is string => !!id);
      if (motionIds.length > 0) {
        assets.push(...(await this.assetRepository.getByIds(motionIds)));
      }

      for (const asset of assets) {
        archive.size += Number(asset.exifInfo?.fileSizeInByte || 0);
        archive.assetIds.push(asset.id);

        if (archive.assetIds.length > MAX_ARCHIVE_FILES || archive.size > MAX_ARCHIVE_SIZE) {
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

    const paths: Record<string, boolean> = {};

    for (const { originalPath, originalFileName } of assets) {
      const ext = extname(originalPath);
      let filename = `${originalFileName}${ext}`;
      for (let i = 0; i < 10_000; i++) {
        if (!paths[filename]) {
          break;
        }
        filename = `${originalFileName}+${i + 1}${ext}`;
      }

      paths[filename] = true;
      zip.addFile(originalPath, filename);
    }

    zip.finalize();

    return { stream: zip.stream };
  }
}
