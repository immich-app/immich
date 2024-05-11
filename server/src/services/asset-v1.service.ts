import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AccessCore, Permission } from 'src/cores/access.core';
import { AssetFileUploadResponseDto } from 'src/dtos/asset-v1-response.dto';
import { CreateAssetDto } from 'src/dtos/asset-v1.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { ASSET_CHECKSUM_CONSTRAINT, AssetEntity, AssetType } from 'src/entities/asset.entity';
import { LibraryType } from 'src/entities/library.entity';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { IAssetRepositoryV1 } from 'src/interfaces/asset-v1.interface';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { IJobRepository, JobName } from 'src/interfaces/job.interface';
import { ILibraryRepository } from 'src/interfaces/library.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { UploadFile } from 'src/services/asset-media.service';
import { getLivePhotoMotionFilename } from 'src/utils/file';
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
      const libraryId = await this.getLibraryId(auth, dto.libraryId);
      await this.access.requirePermission(auth, Permission.ASSET_UPLOAD, libraryId);
      this.requireQuota(auth, file.size);
      if (livePhotoFile) {
        const livePhotoDto = { ...dto, assetType: AssetType.VIDEO, isVisible: false, libraryId };
        livePhotoAsset = await this.create(auth, livePhotoDto, livePhotoFile);
      }

      const asset = await this.create(auth, { ...dto, libraryId }, file, livePhotoAsset?.id, sidecarFile?.originalPath);

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

  private async getLibraryId(auth: AuthDto, libraryId?: string) {
    if (libraryId) {
      return libraryId;
    }

    let library = await this.libraryRepository.getDefaultUploadLibrary(auth.user.id);
    if (!library) {
      library = await this.libraryRepository.create({
        ownerId: auth.user.id,
        name: 'Default Library',
        assets: [],
        type: LibraryType.UPLOAD,
        importPaths: [],
        exclusionPatterns: [],
        isVisible: true,
      });
    }

    return library.id;
  }

  private async create(
    auth: AuthDto,
    dto: CreateAssetDto & { libraryId: string },
    file: UploadFile,
    livePhotoAssetId?: string,
    sidecarPath?: string,
  ): Promise<AssetEntity> {
    const asset = await this.assetRepository.create({
      ownerId: auth.user.id,
      libraryId: dto.libraryId,

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
