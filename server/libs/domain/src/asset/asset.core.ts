import { timeUtils } from '@app/common';
import { AssetEntity, SystemConfig } from '@app/infra/db/entities';
import { BadRequestException, InternalServerErrorException, Logger, StreamableFile } from '@nestjs/common';
import archiver from 'archiver';
import { extname } from 'path';
import { AuthUserDto } from '../auth';
import { asHumanReadable, HumanReadableSize } from '../domain.utils';
import { IJobRepository, JobName } from '../job';
import { StorageCore } from '../storage';
import { ISystemConfigRepository } from '../system-config';
import { IAssetRepository } from './asset.repository';
import { CreateAssetDto, UploadFile } from './dto/create-asset.dto';

export interface DownloadArchive {
  // TODO: replace this
  stream: StreamableFile;
  fileName: string;
  fileSize: number;
  fileCount: number;
  complete: boolean;
}

export class AssetCore {
  private logger = new Logger(AssetCore.name);
  private storageCore: StorageCore;

  constructor(
    private repository: IAssetRepository,
    private jobRepository: IJobRepository,
    configRepository: ISystemConfigRepository,
    config: SystemConfig,
  ) {
    this.storageCore = new StorageCore(repository, configRepository, config);
  }

  async create(
    authUser: AuthUserDto,
    dto: CreateAssetDto,
    file: UploadFile,
    livePhotoAssetId?: string,
  ): Promise<AssetEntity> {
    let asset = await this.repository.create({
      userId: authUser.id,

      mimeType: file.mimeType,
      checksum: file.checksum || null,
      originalPath: file.originalPath,

      createdAt: timeUtils.checkValidTimestamp(dto.createdAt) ? dto.createdAt : new Date().toISOString(),
      modifiedAt: timeUtils.checkValidTimestamp(dto.modifiedAt) ? dto.modifiedAt : new Date().toISOString(),

      deviceAssetId: dto.deviceAssetId,
      deviceId: dto.deviceId,

      type: dto.assetType,
      isFavorite: dto.isFavorite,
      duration: dto.duration || null,
      isVisible: dto.isVisible ?? true,
      livePhotoVideoId: livePhotoAssetId || null,
      resizePath: null,
      webpPath: null,
      encodedVideoPath: null,
      tags: [],
      sharedLinks: [],
    });

    asset = await this.storageCore.moveAsset(asset, file.originalName);

    await this.jobRepository.add({ name: JobName.ASSET_UPLOADED, data: { asset, fileName: file.originalName } });

    return asset;
  }

  public async downloadArchive(name: string, assets: AssetEntity[]): Promise<DownloadArchive> {
    if (!assets || assets.length === 0) {
      throw new BadRequestException('No assets to download.');
    }

    try {
      const archive = archiver('zip', { store: true });
      const stream = new StreamableFile(archive);
      let totalSize = 0;
      let fileCount = 0;
      let complete = true;

      for (const { id, originalPath, exifInfo } of assets) {
        const name = `${exifInfo?.imageName || id}${extname(originalPath)}`;
        archive.file(originalPath, { name });
        totalSize += Number(exifInfo?.fileSizeInByte || 0);
        fileCount++;

        // for easier testing, can be changed before merging.
        if (totalSize > HumanReadableSize.GiB * 20) {
          complete = false;
          this.logger.log(
            `Archive size exceeded after ${fileCount} files, capping at ${totalSize} bytes (${asHumanReadable(
              totalSize,
            )})`,
          );
          break;
        }
      }

      archive.finalize();

      return {
        stream,
        fileName: `${name}.zip`,
        fileSize: totalSize,
        fileCount,
        complete,
      };
    } catch (error) {
      this.logger.error(`Error creating download archive ${error}`);
      throw new InternalServerErrorException(`Failed to download ${name}: ${error}`, 'DownloadArchive');
    }
  }
}
