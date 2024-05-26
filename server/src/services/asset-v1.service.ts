import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AccessCore, Permission } from 'src/cores/access.core';
import { AssetFileUploadResponseDto } from 'src/dtos/asset-v1-response.dto';
import { CreateAssetDto, GetAssetThumbnailDto, GetAssetThumbnailFormatEnum, ServeFileDto } from 'src/dtos/asset-v1.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { ASSET_CHECKSUM_CONSTRAINT, AssetEntity, AssetType } from 'src/entities/asset.entity';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { IAssetRepositoryV1 } from 'src/interfaces/asset-v1.interface';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { IJobRepository, JobName } from 'src/interfaces/job.interface';
import { ILibraryRepository } from 'src/interfaces/library.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { UploadFile } from 'src/services/asset-media.service';
import { CacheControl, ImmichFileResponse, getLivePhotoMotionFilename } from 'src/utils/file';
import { mimeTypes } from 'src/utils/mime-types';
import { QueryFailedError } from 'typeorm';

@Injectable()
/** @deprecated */
export class AssetServiceV1 {
  private access: AccessCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAssetRepositoryV1) private assetRepositoryV1: IAssetRepositoryV1,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ILibraryRepository) private libraryRepository: ILibraryRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.access = AccessCore.create(accessRepository);
    this.logger.setContext(AssetServiceV1.name);
  }

  public async uploadFile(
    auth: AuthDto,
    dto: CreateAssetDto,
    file: UploadFile,
    livePhotoFile?: UploadFile,
    sidecarFile?: UploadFile,
  ): Promise<AssetFileUploadResponseDto> {
    if (livePhotoFile) {
      livePhotoFile = {
        ...livePhotoFile,
        originalName: getLivePhotoMotionFilename(file.originalName, livePhotoFile.originalName),
      };
    }

    let livePhotoAsset: AssetEntity | null = null;

    try {
      await this.access.requirePermission(
        auth,
        Permission.ASSET_UPLOAD,
        // do not need an id here, but the interface requires it
        auth.user.id,
      );

      this.requireQuota(auth, file.size);
      if (livePhotoFile) {
        const livePhotoDto = { ...dto, assetType: AssetType.VIDEO, isVisible: false };
        livePhotoAsset = await this.create(auth, livePhotoDto, livePhotoFile);
      }

      const asset = await this.create(auth, dto, file, livePhotoAsset?.id, sidecarFile?.originalPath);

      await this.userRepository.updateUsage(auth.user.id, (livePhotoFile?.size || 0) + file.size);

      return { id: asset.id, duplicate: false };
    } catch (error: any) {
      // clean up files
      await this.jobRepository.queue({
        name: JobName.DELETE_FILES,
        data: { files: [file.originalPath, livePhotoFile?.originalPath, sidecarFile?.originalPath] },
      });

      // handle duplicates with a success response
      if (error instanceof QueryFailedError && (error as any).constraint === ASSET_CHECKSUM_CONSTRAINT) {
        const checksums = [file.checksum, livePhotoFile?.checksum].filter((checksum): checksum is Buffer => !!checksum);
        const [duplicate] = await this.assetRepositoryV1.getAssetsByChecksums(auth.user.id, checksums);
        return { id: duplicate.id, duplicate: true };
      }

      this.logger.error(`Error uploading file ${error}`, error?.stack);
      throw error;
    }
  }

  async serveThumbnail(auth: AuthDto, assetId: string, dto: GetAssetThumbnailDto): Promise<ImmichFileResponse> {
    await this.access.requirePermission(auth, Permission.ASSET_VIEW, assetId);

    const asset = await this.assetRepositoryV1.get(assetId);
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    const filepath = this.getThumbnailPath(asset, dto.format);

    return new ImmichFileResponse({
      path: filepath,
      contentType: mimeTypes.lookup(filepath),
      cacheControl: CacheControl.PRIVATE_WITH_CACHE,
    });
  }

  public async serveFile(auth: AuthDto, assetId: string, dto: ServeFileDto): Promise<ImmichFileResponse> {
    // this is not quite right as sometimes this returns the original still
    await this.access.requirePermission(auth, Permission.ASSET_VIEW, assetId);

    const asset = await this.assetRepository.getById(assetId);
    if (!asset) {
      throw new NotFoundException('Asset does not exist');
    }

    const allowOriginalFile = !!(!auth.sharedLink || auth.sharedLink?.allowDownload);

    const filepath =
      asset.type === AssetType.IMAGE
        ? this.getServePath(asset, dto, allowOriginalFile)
        : asset.encodedVideoPath || asset.originalPath;

    return new ImmichFileResponse({
      path: filepath,
      contentType: mimeTypes.lookup(filepath),
      cacheControl: CacheControl.PRIVATE_WITH_CACHE,
    });
  }

  private getThumbnailPath(asset: AssetEntity, format: GetAssetThumbnailFormatEnum) {
    switch (format) {
      case GetAssetThumbnailFormatEnum.WEBP: {
        if (asset.thumbnailPath) {
          return asset.thumbnailPath;
        }
        this.logger.warn(`WebP thumbnail requested but not found for asset ${asset.id}, falling back to JPEG`);
      }
      case GetAssetThumbnailFormatEnum.JPEG: {
        if (!asset.previewPath) {
          throw new NotFoundException(`No thumbnail found for asset ${asset.id}`);
        }
        return asset.previewPath;
      }
    }
  }

  private getServePath(asset: AssetEntity, dto: ServeFileDto, allowOriginalFile: boolean): string {
    const mimeType = mimeTypes.lookup(asset.originalPath);

    /**
     * Serve file viewer on the web
     */
    if (dto.isWeb && mimeType != 'image/gif') {
      if (!asset.previewPath) {
        this.logger.error('Error serving IMAGE asset for web');
        throw new InternalServerErrorException(`Failed to serve image asset for web`, 'ServeFile');
      }

      return asset.previewPath;
    }

    /**
     * Serve thumbnail image for both web and mobile app
     */
    if ((!dto.isThumb && allowOriginalFile) || (dto.isWeb && mimeType === 'image/gif')) {
      return asset.originalPath;
    }

    if (asset.thumbnailPath && asset.thumbnailPath.length > 0) {
      return asset.thumbnailPath;
    }

    if (!asset.previewPath) {
      throw new Error('previewPath not set');
    }

    return asset.previewPath;
  }

  private async create(
    auth: AuthDto,
    dto: CreateAssetDto,
    file: UploadFile,
    livePhotoAssetId?: string,
    sidecarPath?: string,
  ): Promise<AssetEntity> {
    const asset = await this.assetRepository.create({
      ownerId: auth.user.id,
      libraryId: null,

      checksum: file.checksum,
      originalPath: file.originalPath,

      deviceAssetId: dto.deviceAssetId,
      deviceId: dto.deviceId,

      fileCreatedAt: dto.fileCreatedAt,
      fileModifiedAt: dto.fileModifiedAt,
      localDateTime: dto.fileCreatedAt,

      type: mimeTypes.assetType(file.originalPath),
      isFavorite: dto.isFavorite,
      isArchived: dto.isArchived ?? false,
      duration: dto.duration || null,
      isVisible: dto.isVisible ?? true,
      livePhotoVideo: livePhotoAssetId === null ? null : ({ id: livePhotoAssetId } as AssetEntity),
      originalFileName: file.originalName,
      sidecarPath: sidecarPath || null,
      isOffline: dto.isOffline ?? false,
    });

    if (sidecarPath) {
      await this.storageRepository.utimes(sidecarPath, new Date(), new Date(dto.fileModifiedAt));
    }
    await this.storageRepository.utimes(file.originalPath, new Date(), new Date(dto.fileModifiedAt));
    await this.assetRepository.upsertExif({ assetId: asset.id, fileSizeInByte: file.size });
    await this.jobRepository.queue({ name: JobName.METADATA_EXTRACTION, data: { id: asset.id, source: 'upload' } });

    return asset;
  }

  private requireQuota(auth: AuthDto, size: number) {
    if (auth.user.quotaSizeInBytes && auth.user.quotaSizeInBytes < auth.user.quotaUsageInBytes + size) {
      throw new BadRequestException('Quota has been exceeded!');
    }
  }
}
