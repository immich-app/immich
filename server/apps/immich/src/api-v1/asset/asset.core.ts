import { AuthUserDto, IJobRepository, JobName } from '@app/domain';
import { AssetEntity, UserEntity } from '@app/infra/entities';
import { IAssetRepository } from './asset-repository';
import { CreateAssetDto, UploadFile } from './dto/create-asset.dto';
import { parse } from 'node:path';

export class AssetCore {
  constructor(private repository: IAssetRepository, private jobRepository: IJobRepository) {}

  async create(
    authUser: AuthUserDto,
    dto: CreateAssetDto,
    file: UploadFile,
    livePhotoAssetId?: string,
    sidecarFile?: UploadFile,
  ): Promise<AssetEntity> {
    const asset = await this.repository.create({
      owner: { id: authUser.id } as UserEntity,

      mimeType: file.mimeType,
      checksum: file.checksum,
      originalPath: file.originalPath,

      deviceAssetId: dto.deviceAssetId,
      deviceId: dto.deviceId,

      fileCreatedAt: dto.fileCreatedAt,
      fileModifiedAt: dto.fileModifiedAt,

      type: dto.assetType,
      isFavorite: dto.isFavorite,
      isArchived: dto.isArchived ?? false,
      duration: dto.duration || null,
      isVisible: dto.isVisible ?? true,
      livePhotoVideo: livePhotoAssetId != null ? ({ id: livePhotoAssetId } as AssetEntity) : null,
      resizePath: null,
      webpPath: null,
      encodedVideoPath: null,
      tags: [],
      sharedLinks: [],
      originalFileName: parse(file.originalName).name,
      faces: [],
      sidecarPath: sidecarFile?.originalPath || null,
    });

    await this.jobRepository.queue({ name: JobName.ASSET_UPLOADED, data: { asset } });

    return asset;
  }
}
