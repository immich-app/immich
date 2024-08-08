import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { dirname } from 'node:path';
import { AccessCore, Permission } from 'src/cores/access.core';
import { StorageCore, StorageFolder } from 'src/cores/storage.core';
import { AssetResponseDto, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  EditorAction,
  EditorActionAdjust,
  EditorActionBlur,
  EditorActionCrop,
  EditorActionRotate,
  EditorActionType,
  EditorCreateAssetDto,
} from 'src/dtos/editor.dto';
import { AssetType } from 'src/entities/asset.entity';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { IJobRepository, JobName } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IMediaRepository, MediaEditItem } from 'src/interfaces/media.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';

@Injectable()
export class EditorService {
  private access: AccessCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
    @Inject(IMediaRepository) private mediaRepository: IMediaRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
  ) {
    this.access = AccessCore.create(accessRepository);
  }

  async createAssetFromEdits(auth: AuthDto, dto: EditorCreateAssetDto): Promise<AssetResponseDto> {
    await this.access.requirePermission(auth, Permission.ASSET_VIEW, dto.id);

    const asset = await this.assetRepository.getById(dto.id);
    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    if (asset.type !== AssetType.IMAGE) {
      throw new BadRequestException('Only images can be edited');
    }

    const uuid = this.cryptoRepository.randomUUID();
    const outputFile = StorageCore.getNestedPath(StorageFolder.UPLOAD, auth.user.id, uuid);
    this.storageRepository.mkdirSync(dirname(outputFile));

    await this.mediaRepository.applyEdits(asset.originalPath, outputFile, this.asMediaEdits(dto.edits));

    try {
      const checksum = await this.cryptoRepository.hashFile(outputFile);
      const { size } = await this.storageRepository.stat(outputFile);

      const newAsset = await this.assetRepository.create({
        id: uuid,
        ownerId: auth.user.id,
        deviceId: 'immich-editor',
        deviceAssetId: asset.deviceAssetId + `-edit-${Date.now()}`,
        libraryId: null,
        type: asset.type,
        originalPath: outputFile,
        localDateTime: asset.localDateTime,
        fileCreatedAt: asset.fileCreatedAt,
        fileModifiedAt: asset.fileModifiedAt,
        isFavorite: false,
        isArchived: false,
        isExternal: false,
        isOffline: false,
        checksum,
        isVisible: true,
        originalFileName: asset.originalFileName,
        sidecarPath: null,
        tags: asset.tags,
        duplicateId: null,
      });

      await this.assetRepository.upsertExif({ assetId: newAsset.id, fileSizeInByte: size });
      await this.jobRepository.queue({
        name: JobName.METADATA_EXTRACTION,
        data: { id: newAsset.id, source: 'editor' },
      });

      return mapAsset(newAsset, { auth });
    } catch (error: Error | any) {
      this.logger.error(`Failed to create asset from edits: ${error}`, error?.stack);
      await this.jobRepository.queue({ name: JobName.DELETE_FILES, data: { files: [outputFile] } });
      throw new InternalServerErrorException('Failed to create asset from edits');
    }
  }

  private asMediaEdits(edits: EditorAction[]) {
    const mediaEdits: MediaEditItem[] = [];
    for (const { action, ...options } of edits) {
      switch (action) {
        case EditorActionType.Crop: {
          mediaEdits.push({ ...(options as EditorActionCrop), action: 'crop' });
          break;
        }

        case EditorActionType.Rotate: {
          mediaEdits.push({ ...(options as EditorActionRotate), action: 'rotate' });
          break;
        }

        case EditorActionType.Blur: {
          mediaEdits.push({ ...(options as EditorActionBlur), action: 'blur' });
          break;
        }

        case EditorActionType.Adjust: {
          mediaEdits.push({ ...(options as EditorActionAdjust), action: 'modulate' });
          break;
        }
      }
    }

    return mediaEdits;
  }
}
