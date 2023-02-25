import {
  AuthUserDto,
  IJobRepository,
  IStorageRepository,
  ISystemConfigRepository,
  JobName,
  StorageTemplateCore,
} from '@app/domain';
import { AssetEntity, SystemConfig, UserEntity } from '@app/infra/db/entities';
import { Logger } from '@nestjs/common';
import { IAssetRepository } from './asset-repository';
import { CreateAssetDto, UploadFile } from './dto/create-asset.dto';

export class AssetCore {
  private templateCore: StorageTemplateCore;
  private logger = new Logger(AssetCore.name);

  constructor(
    private repository: IAssetRepository,
    private jobRepository: IJobRepository,
    configRepository: ISystemConfigRepository,
    config: SystemConfig,
    private storageRepository: IStorageRepository,
  ) {
    this.templateCore = new StorageTemplateCore(configRepository, config, storageRepository);
  }

  async create(
    authUser: AuthUserDto,
    dto: CreateAssetDto,
    file: UploadFile,
    livePhotoAssetId?: string,
  ): Promise<AssetEntity> {
    let asset = await this.repository.create({
      owner: { id: authUser.id } as UserEntity,

      mimeType: file.mimeType,
      checksum: file.checksum || null,
      originalPath: file.originalPath,

      deviceAssetId: dto.deviceAssetId,
      deviceId: dto.deviceId,

      fileCreatedAt: dto.fileCreatedAt,
      fileModifiedAt: dto.fileModifiedAt,

      type: dto.assetType,
      isFavorite: dto.isFavorite,
      duration: dto.duration || null,
      isVisible: dto.isVisible ?? true,
      livePhotoVideo: livePhotoAssetId != null ? ({ id: livePhotoAssetId } as AssetEntity) : null,
      resizePath: null,
      webpPath: null,
      encodedVideoPath: null,
      tags: [],
      sharedLinks: [],
    });

    asset = await this.moveAsset(asset, file.originalName);

    await this.jobRepository.queue({ name: JobName.ASSET_UPLOADED, data: { asset, fileName: file.originalName } });

    return asset;
  }

  async moveAsset(asset: AssetEntity, originalName: string) {
    const destination = await this.templateCore.getTemplatePath(asset, originalName);
    if (asset.originalPath !== destination) {
      const source = asset.originalPath;

      try {
        await this.storageRepository.moveFile(asset.originalPath, destination);
        try {
          await this.repository.save({ id: asset.id, originalPath: destination });
          asset.originalPath = destination;
        } catch (error: any) {
          this.logger.warn('Unable to save new originalPath to database, undoing move', error?.stack);
          await this.storageRepository.moveFile(destination, source);
        }
      } catch (error: any) {
        this.logger.error(`Problem applying storage template`, error?.stack, { id: asset.id, source, destination });
      }
    }
    return asset;
  }
}
