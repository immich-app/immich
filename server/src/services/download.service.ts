import { BadRequestException, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { parse } from 'node:path';
import { StorageCore } from 'src/cores/storage.core';
import { OnJob } from 'src/decorators';
import { AssetIdsDto } from 'src/dtos/asset.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  DownloadArchiveInfo,
  DownloadInfoDto,
  DownloadResponseDto,
  PrepareDownloadResponseDto,
} from 'src/dtos/download.dto';
import { JobName, JobStatus, Permission, QueueName } from 'src/enum';
import { ImmichReadStream } from 'src/repositories/storage.repository';
import { BaseService } from 'src/services/base.service';
import { HumanReadableSize } from 'src/utils/bytes';
import { getPreferences } from 'src/utils/preferences';

@Injectable()
export class DownloadService extends BaseService {
  @OnJob({ name: JobName.DownloadRequestCleanup, queue: QueueName.BackgroundTask })
  async handleDownloadRequestCleanup(): Promise<JobStatus> {
    const requests = await this.downloadRequestRepository.cleanup();

    this.logger.log(`Deleted ${requests.length} expired download requests`);

    return JobStatus.Success;
  }

  async getDownloadInfo(auth: AuthDto, dto: DownloadInfoDto): Promise<DownloadResponseDto> {
    let assets;

    if (dto.assetIds) {
      const assetIds = dto.assetIds;
      await this.requireAccess({ auth, permission: Permission.AssetDownload, ids: assetIds });
      assets = this.downloadRepository.downloadAssetIds(assetIds);
    } else if (dto.albumId) {
      const albumId = dto.albumId;
      await this.requireAccess({ auth, permission: Permission.AlbumDownload, ids: [albumId] });
      assets = this.downloadRepository.downloadAlbumId(albumId);
    } else if (dto.userId) {
      const userId = dto.userId;
      await this.requireAccess({ auth, permission: Permission.TimelineDownload, ids: [userId] });
      assets = this.downloadRepository.downloadUserId(userId);
    } else {
      throw new BadRequestException('assetIds, albumId, or userId is required');
    }

    const targetSize = dto.archiveSize || HumanReadableSize.GiB * 4;
    const metadata = await this.userRepository.getMetadata(auth.user.id);
    const preferences = getPreferences(metadata);
    const motionIds = new Set<string>();
    const archives: DownloadArchiveInfo[] = [];
    let archive: DownloadArchiveInfo = { size: 0, assetIds: [] };

    const addToArchive = ({ id, size }: { id: string; size: number | null }) => {
      archive.assetIds.push(id);
      archive.size += Number(size || 0);

      if (archive.size > targetSize) {
        archives.push(archive);
        archive = { size: 0, assetIds: [] };
      }
    };

    for await (const asset of assets) {
      // motion part of live photos
      if (asset.livePhotoVideoId) {
        motionIds.add(asset.livePhotoVideoId);
      }

      addToArchive(asset);
    }

    if (motionIds.size > 0) {
      const motionAssets = this.downloadRepository.downloadMotionAssetIds([...motionIds]);
      for await (const motionAsset of motionAssets) {
        if (StorageCore.isAndroidMotionPath(motionAsset.originalPath) && !preferences.download.includeEmbeddedVideos) {
          continue;
        }

        addToArchive(motionAsset);
      }
    }

    if (archive.assetIds.length > 0) {
      archives.push(archive);
    }

    let totalSize = 0;
    for (const archive of archives) {
      totalSize += archive.size;
    }

    return { totalSize, archives };
  }

  async prepareDownload(auth: AuthDto, dto: DownloadInfoDto): Promise<PrepareDownloadResponseDto> {
    const info = await this.getDownloadInfo(auth, dto);
    const expiresAt = DateTime.now().plus({ hours: 24 }).toJSDate();

    const newArchives = [];
    for (const archive of info.archives) {
      const downloadRequest = await this.downloadRequestRepository.create({ expiresAt, assetIds: archive.assetIds });
      newArchives.push({ size: archive.size, downloadRequestId: downloadRequest.id });
    }

    return { totalSize: info.totalSize, archives: newArchives };
  }

  async downloadArchive(auth: AuthDto, dto: AssetIdsDto): Promise<ImmichReadStream> {
    await this.requireAccess({ auth, permission: Permission.AssetDownload, ids: dto.assetIds });

    const zip = this.storageRepository.createZipStream();
    const assets = await this.assetRepository.getByIds(dto.assetIds);
    const assetMap = new Map(assets.map((asset) => [asset.id, asset]));
    const paths: Record<string, number> = {};

    for (const assetId of dto.assetIds) {
      const asset = assetMap.get(assetId);
      if (!asset) {
        continue;
      }

      const { originalPath, originalFileName } = asset;

      let filename = originalFileName;
      const count = paths[filename] || 0;
      paths[filename] = count + 1;
      if (count !== 0) {
        const parsedFilename = parse(originalFileName);
        filename = `${parsedFilename.name}+${count}${parsedFilename.ext}`;
      }

      let realpath = originalPath;
      try {
        realpath = await this.storageRepository.realpath(originalPath);
      } catch {
        this.logger.warn('Unable to resolve realpath', { originalPath });
      }

      zip.addFile(realpath, filename);
    }

    void zip.finalize();

    return { stream: zip.stream };
  }

  async downloadRequestArchive(auth: AuthDto, downloadRequestId: string): Promise<ImmichReadStream> {
    const downloadRequest = await this.downloadRequestRepository.get(downloadRequestId);
    const dto = { assetIds: downloadRequest.assetIds };
    return this.downloadArchive(auth, dto);
  }
}
