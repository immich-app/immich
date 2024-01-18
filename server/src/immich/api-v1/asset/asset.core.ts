import { AuthDto, IJobRepository, JobName, mimeTypes, UploadFile } from '@app/domain';
import { AssetEntity } from '@app/infra/entities';
import { BadRequestException } from '@nestjs/common';
import { parse } from 'node:path';
import { IAssetRepository } from './asset-repository';
import { CreateAssetDto } from './dto/create-asset.dto';

export class AssetCore {
  constructor(
    private repository: IAssetRepository,
    private jobRepository: IJobRepository,
  ) {}

  async create(
    auth: AuthDto,
    dto: CreateAssetDto & { libraryId: string },
    file: UploadFile,
    livePhotoAssetId?: string,
    sidecarPath?: string,
  ): Promise<AssetEntity> {
    const asset = await this.repository.create({
      ownerId: auth.user.id,
      libraryId: dto.libraryId,

      checksum: file.checksum,
      originalPath: file.originalPath,

      deviceAssetId: dto.deviceAssetId,
      deviceId: dto.deviceId,

      fileCreatedAt: dto.fileCreatedAt,
      fileModifiedAt: dto.fileModifiedAt,
      localDateTime: dto.fileCreatedAt,
      deletedAt: null,

      type: mimeTypes.assetType(file.originalPath),
      isFavorite: dto.isFavorite,
      isArchived: dto.isArchived ?? false,
      duration: dto.duration || null,
      isVisible: dto.isVisible ?? true,
      livePhotoVideo: livePhotoAssetId != null ? ({ id: livePhotoAssetId } as AssetEntity) : null,
      resizePath: null,
      webpPath: null,
      thumbhash: null,
      encodedVideoPath: null,
      tags: [],
      sharedLinks: [],
      originalFileName: parse(file.originalName).name,
      faces: [],
      sidecarPath: sidecarPath || null,
      isReadOnly: dto.isReadOnly ?? false,
      isExternal: dto.isExternal ?? false,
      isOffline: dto.isOffline ?? false,
    });

    await this.repository.upsertExif({ assetId: asset.id, fileSizeInByte: file.size });
    await this.jobRepository.queue({ name: JobName.METADATA_EXTRACTION, data: { id: asset.id, source: 'upload' } });

    return asset;
  }

  static requireQuota(auth: AuthDto, size: number) {
    if (auth.user.quotaSizeInBytes && auth.user.quotaSizeInBytes < auth.user.quotaUsageInBytes + size) {
      throw new BadRequestException('Quota has been exceeded!');
    }
  }
}
