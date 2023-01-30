import { timeUtils } from '@app/common';
import { AuthUserDto, IJobRepository, JobName } from '@app/domain';
import { AssetEntity } from '@app/infra/db/entities';
import { StorageService } from '@app/storage';
import { IAssetRepository } from './asset-repository';
import { CreateAssetDto, UploadFile } from './dto/create-asset.dto';

export class AssetCore {
  constructor(
    private repository: IAssetRepository,
    private jobRepository: IJobRepository,
    private storageService: StorageService,
  ) {}

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

    asset = await this.storageService.moveAsset(asset, file.originalName);

    await this.jobRepository.add({ name: JobName.ASSET_UPLOADED, data: { asset, fileName: file.originalName } });

    return asset;
  }
}
