import { AuthUserDto, IJobRepository, JobName } from '@app/domain';
import { AssetEntity, UserEntity } from '@app/infra/db/entities';
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

    asset = await this.storageService.moveAsset(asset, file.originalName);

    await this.jobRepository.add({ name: JobName.ASSET_UPLOADED, data: { asset, fileName: file.originalName } });

    return asset;
  }
}
