import { AssetEntity } from '@app/infra/entities';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { extname } from 'node:path';
import { AccessCore, Permission } from '../access';
import { AssetIdsDto } from '../asset';
import { AuthDto } from '../auth';
import { mimeTypes } from '../domain.constant';
import { CacheControl, HumanReadableSize, ImmichFileResponse, usePagination } from '../domain.util';
import { IAccessRepository, IAssetRepository, IStorageRepository, ImmichReadStream } from '../repositories';
import { DownloadArchiveInfo, DownloadInfoDto, DownloadResponseDto } from './download.dto';

@Injectable()
export class DownloadService {
  private access: AccessCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
  ) {
    this.access = AccessCore.create(accessRepository);
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
      cacheControl: CacheControl.NONE,
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

    let totalSize = 0;
    for (const archive of archives) {
      totalSize += archive.size;
    }

    return { totalSize, archives };
  }

  async downloadArchive(auth: AuthDto, dto: AssetIdsDto): Promise<ImmichReadStream> {
    await this.access.requirePermission(auth, Permission.ASSET_DOWNLOAD, dto.assetIds);

    const zip = this.storageRepository.createZipStream();
    const assets = await this.assetRepository.getByIds(dto.assetIds);
    const paths: Record<string, number> = {};

    for (const { originalPath, originalFileName } of assets) {
      const extension = extname(originalPath);
      let filename = `${originalFileName}${extension}`;
      const count = paths[filename] || 0;
      paths[filename] = count + 1;
      if (count !== 0) {
        filename = `${originalFileName}+${count}${extension}`;
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
}
