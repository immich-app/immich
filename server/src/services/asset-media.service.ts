import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { AccessCore, Permission } from 'src/cores/access.core';
import { AssetMediaUpdateResponseDto, DuplicateAssetResponseDto } from 'src/dtos/asset-media-response.dto';
import { UpdateAssetMediaDto, UploadFieldName } from 'src/dtos/asset-media.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { ASSET_CHECKSUM_CONSTRAINT, AssetEntity } from 'src/entities/asset.entity';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { ClientEvent, IEventRepository } from 'src/interfaces/event.interface';
import { IJobRepository, JobName } from 'src/interfaces/job.interface';
import { ILibraryRepository } from 'src/interfaces/library.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { mimeTypes } from 'src/utils/mime-types';
import { QueryFailedError } from 'typeorm';

export interface UploadRequest {
  auth: AuthDto | null;
  fieldName: UploadFieldName;
  file: UploadFile;
}

export interface UploadFile {
  uuid: string;
  checksum: Buffer;
  originalPath: string;
  originalName: string;
  size: number;
}

export interface UploadRequest {
  auth: AuthDto | null;
  fieldName: UploadFieldName;
  file: UploadFile;
}

export interface UploadFile {
  uuid: string;
  checksum: Buffer;
  originalPath: string;
  originalName: string;
  size: number;
}

@Injectable()
export class AssetMediaService {
  private access: AccessCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ILibraryRepository) private libraryRepository: ILibraryRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(IEventRepository) private eventRepository: IEventRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(AssetMediaService.name);
    this.access = AccessCore.create(accessRepository);
  }

  public async replaceAsset(
    auth: AuthDto,
    id: string,
    dto: UpdateAssetMediaDto,
    file: UploadFile,
    sidecarFile?: UploadFile,
  ): Promise<AssetMediaUpdateResponseDto | DuplicateAssetResponseDto> {
    try {
      await this.access.requirePermission(auth, Permission.ASSET_UPDATE, id);
      const existingAssetEntity = (await this.assetRepository.getById(id)) as AssetEntity;

      this.requireQuota(auth, file.size);

      await this.updateAssetFileData(existingAssetEntity.id, dto, file, sidecarFile?.originalPath);

      // Next, create a backup copy of the existing record. The db record has already been updated above,
      // but the local variable holds the original file data paths.
      const copiedPhoto = await this.createAssetCopy(existingAssetEntity);
      // and immediate trash it
      await this.assetRepository.softDeleteAll([copiedPhoto.id]);
      this.eventRepository.clientSend(ClientEvent.ASSET_TRASH, auth.user.id, [copiedPhoto.id]);

      await this.userRepository.updateUsage(auth.user.id, file.size);

      return new AssetMediaUpdateResponseDto(id, copiedPhoto.id);
    } catch (error: any) {
      return await this.handleUploadError(error, auth, file, sidecarFile);
    }
  }

  private async handleUploadError(
    error: any,
    auth: AuthDto,
    file: UploadFile,
    sidecarFile?: UploadFile,
  ): Promise<DuplicateAssetResponseDto> {
    // clean up files
    await this.jobRepository.queue({
      name: JobName.DELETE_FILES,
      data: { files: [file.originalPath, sidecarFile?.originalPath] },
    });

    // handle duplicates with a success response
    if (error instanceof QueryFailedError && (error as any).constraint === ASSET_CHECKSUM_CONSTRAINT) {
      const duplicate = await this.assetRepository.getByChecksums(auth.user.id, [file.checksum]);
      if (!duplicate || duplicate.length !== 1) {
        this.logger.error(`Error locating duplicate for checksum constraint`);
        throw new InternalServerErrorException();
      }
      return new DuplicateAssetResponseDto(duplicate[0].id);
    }

    this.logger.error(`Error uploading file ${error}`, error?.stack);
    throw error;
  }

  /**
   * Updates the specified assetId to the specified photo data file properties: checksum, path,
   * timestamps, deviceIds, and sidecar. Derived properties like: faces, smart search info, etc
   * are UNTOUCHED. The photo data files modification times on the filesysytem are updated to
   * the specified timestamps. The exif db record is upserted, and then A METADATA_EXTRACTION
   * job is queued to update these derived properties.
   */
  private async updateAssetFileData(
    assetId: string,
    dto: UpdateAssetMediaDto,
    file: UploadFile,
    sidecarPath?: string,
  ): Promise<void> {
    await this.assetRepository.update({
      id: assetId,

      checksum: file.checksum,
      originalPath: file.originalPath,
      type: mimeTypes.assetType(file.originalPath),
      originalFileName: file.originalName,

      deviceAssetId: dto.deviceAssetId,
      deviceId: dto.deviceId,
      fileCreatedAt: dto.fileCreatedAt,
      fileModifiedAt: dto.fileModifiedAt,
      localDateTime: dto.fileCreatedAt,
      duration: dto.duration || null,

      livePhotoVideo: null,
      sidecarPath: sidecarPath || null,
    });

    await this.storageRepository.utimes(file.originalPath, new Date(), new Date(dto.fileModifiedAt));
    await this.assetRepository.upsertExif({ assetId, fileSizeInByte: file.size });
    await this.jobRepository.queue({
      name: JobName.METADATA_EXTRACTION,
      data: { id: assetId, source: 'upload' },
    });
  }

  /**
   * Create a 'shallow' copy of the specified asset record creating a new asset record in the database.
   * Uses only vital properties likxcluding things like: stacks, faces, smart search info, etc,
   * and then queues a METADATA_EXTRACTION job.
   */
  private async createAssetCopy(asset: AssetEntity): Promise<AssetEntity> {
    const created = await this.assetRepository.create({
      ownerId: asset.ownerId,
      originalPath: asset.originalPath,
      originalFileName: asset.originalFileName,
      libraryId: asset.libraryId,
      deviceAssetId: asset.deviceAssetId,
      deviceId: asset.deviceId,
      type: asset.type,
      checksum: asset.checksum,
      fileCreatedAt: asset.fileCreatedAt,
      localDateTime: asset.localDateTime,
      fileModifiedAt: asset.fileModifiedAt,
      livePhotoVideoId: asset.livePhotoVideoId,
      sidecarPath: asset.sidecarPath,
    });

    const { size } = await this.storageRepository.stat(created.originalPath);
    await this.assetRepository.upsertExif({ assetId: created.id, fileSizeInByte: size });
    await this.jobRepository.queue({ name: JobName.METADATA_EXTRACTION, data: { id: created.id, source: 'copy' } });
    return created;
  }

  private requireQuota(auth: AuthDto, size: number) {
    if (auth.user.quotaSizeInBytes && auth.user.quotaSizeInBytes < auth.user.quotaUsageInBytes + size) {
      throw new BadRequestException('Quota has been exceeded!');
    }
  }
}
