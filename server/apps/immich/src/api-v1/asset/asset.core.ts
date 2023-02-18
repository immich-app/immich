import {
  AuthUserDto,
  IJobRepository,
  IStorageRepository,
  ISystemConfigRepository,
  JobName,
  StorageCore,
} from '@app/domain';
import { AssetEntity, SystemConfig, UserEntity } from '@app/infra/db/entities';
import { IAssetRepository } from './asset-repository';
import { CreateAssetDto, UploadFile } from './dto/create-asset.dto';

export class AssetCore {
  private storageCore: StorageCore;

  constructor(
    private repository: IAssetRepository,
    private jobRepository: IJobRepository,
    configRepository: ISystemConfigRepository,
    config: SystemConfig,
    private storageRepository: IStorageRepository,
  ) {
    this.storageCore = new StorageCore(configRepository, config, storageRepository);
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

    const destination = await this.storageCore.getTemplatePath(asset, file.originalName);
    if (asset.originalPath !== destination) {
      await this.storageRepository.moveFile(asset.originalPath, destination);
      asset.originalPath = destination;
      asset = await this.repository.save(asset);
    }

    await this.jobRepository.queue({ name: JobName.ASSET_UPLOADED, data: { asset, fileName: file.originalName } });

    return asset;
  }
}
