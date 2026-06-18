import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { extname } from 'node:path';
import sanitize from 'sanitize-filename';
import { StorageCore } from 'src/cores/storage.core';
import { AuthSharedLink } from 'src/database';
import {
  AssetBulkUploadCheckResponseDto,
  AssetMediaResponseDto,
  AssetMediaStatus,
  AssetRejectReason,
  AssetUploadAction,
} from 'src/dtos/asset-media-response.dto';
import {
  AssetBulkUploadCheckDto,
  AssetMediaCreateDto,
  AssetMediaOptionsDto,
  AssetMediaSize,
  UploadFieldName,
} from 'src/dtos/asset-media.dto';
import { AssetDownloadOriginalDto } from 'src/dtos/asset.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  AssetFileType,
  AssetVisibility,
  CacheControl,
  ChecksumAlgorithm,
  JobName,
  Permission,
  StorageFolder,
} from 'src/enum';
import { AuthRequest } from 'src/middleware/auth.guard';
import { BaseService } from 'src/services/base.service';
import { UploadFile, UploadRequest } from 'src/types';
import { requireUploadAccess } from 'src/utils/access';
import { asUploadRequest, onBeforeLink } from 'src/utils/asset.util';
import { isAssetChecksumConstraint } from 'src/utils/database';
import { getFilenameExtension, getFileNameWithoutExtension, ImmichFileResponse } from 'src/utils/file';
import { mimeTypes } from 'src/utils/mime-types';
import { fromChecksum } from 'src/utils/request';

export interface AssetMediaRedirectResponse {
  targetSize: AssetMediaSize | 'original';
}

@Injectable()
export class AssetMediaService extends BaseService {
  async getUploadAssetIdByChecksum(auth: AuthDto, checksum?: string): Promise<AssetMediaResponseDto | undefined> {
    if (!checksum) {
      return;
    }

    const assetId = await this.assetRepository.getUploadAssetIdByChecksum(auth.user.id, fromChecksum(checksum));
    if (!assetId) {
      return;
    }

    return { id: assetId, status: AssetMediaStatus.DUPLICATE };
  }

  canUploadFile({ auth, fieldName, file, body }: UploadRequest): true {
    requireUploadAccess(auth);

    const filename = body.filename || file.originalName;

    switch (fieldName) {
      case UploadFieldName.ASSET_DATA: {
        if (mimeTypes.isAsset(filename)) {
          return true;
        }
        break;
      }

      case UploadFieldName.SIDECAR_DATA: {
        if (mimeTypes.isSidecar(filename)) {
          return true;
        }
        break;
      }

      case UploadFieldName.PROFILE_DATA: {
        if (mimeTypes.isProfile(filename)) {
          return true;
        }
        break;
      }
    }

    this.logger.error(`Unsupported file type ${filename}`);
    throw new BadRequestException(`Unsupported file type ${filename}`);
  }

  getUploadFilename({ auth, fieldName, file, body }: UploadRequest): string {
    requireUploadAccess(auth);

    const extension = extname(body.filename || file.originalName);

    const lookup = {
      [UploadFieldName.ASSET_DATA]: extension,
      [UploadFieldName.SIDECAR_DATA]: '.xmp',
      [UploadFieldName.PROFILE_DATA]: extension,
    };

    return sanitize(`${file.uuid}${lookup[fieldName]}`);
  }

  getUploadFolder({ auth, fieldName, file }: UploadRequest): string {
    auth = requireUploadAccess(auth);

    let folder = StorageCore.getNestedFolder(StorageFolder.Upload, auth.user.id, file.uuid);
    if (fieldName === UploadFieldName.PROFILE_DATA) {
      folder = StorageCore.getFolderLocation(StorageFolder.Profile, auth.user.id);
    }

    this.storageRepository.mkdirSync(folder);

    return folder;
  }

  async onUploadError(request: AuthRequest, file: Express.Multer.File) {
    const uploadFilename = this.getUploadFilename(asUploadRequest(request, file));
    const uploadFolder = this.getUploadFolder(asUploadRequest(request, file));
    const uploadPath = `${uploadFolder}/${uploadFilename}`;

    await this.jobRepository.queue({ name: JobName.FileDelete, data: { files: [uploadPath] } });
  }

  async uploadAsset(
    auth: AuthDto,
    dto: AssetMediaCreateDto,
    file: UploadFile,
    sidecarFile?: UploadFile,
  ): Promise<AssetMediaResponseDto> {
    try {
      await this.requireAccess({
        auth,
        permission: Permission.AssetUpload,
        // do not need an id here, but the interface requires it
        ids: [auth.user.id],
      });

      this.requireQuota(auth, file.size);

      if (dto.stackParentId) {
        if (auth.sharedLink) {
          throw new BadRequestException('Cannot stack an asset uploaded via shared link');
        }
        await this.requireAccess({ auth, permission: Permission.AssetUpdate, ids: [dto.stackParentId] });
        const parent = await this.assetRepository.getById(dto.stackParentId);
        if (!parent || parent.deletedAt) {
          throw new BadRequestException('Cannot stack onto a trashed or missing asset');
        }
      }

      if (dto.livePhotoVideoId) {
        await onBeforeLink(
          { asset: this.assetRepository, event: this.eventRepository },
          { userId: auth.user.id, livePhotoVideoId: dto.livePhotoVideoId },
        );
      }
      const asset = await this.create(auth.user.id, dto, file, sidecarFile);

      if (auth.sharedLink) {
        await this.addToSharedLink(auth.sharedLink, asset.id);
      }

      if (dto.stackParentId) {
        // Linking is best-effort: a failure must not skip the AssetCreate event
        // (quota + workflows) below, so swallow it and still emit.
        const linkResult = await this.linkToStackParent(
          auth.user.id,
          asset.id,
          dto.stackParentId,
          dto.keepPrimary,
        ).catch((error: any) => {
          this.logger.error(`Post-create stack linking failed for asset ${asset.id}: ${error}`, error?.stack);
          return null;
        });
        // emit AssetCreate with the populated stackId so clients don't briefly
        // see the asset as standalone. Guard the emit too: the asset already
        // exists, so a listener failure must not fall through to
        // handleUploadError and FileDelete, which would orphan the row.
        try {
          await this.eventRepository.emit('AssetCreate', {
            asset: linkResult ? { ...asset, stackId: linkResult.stackId } : asset,
            file,
          });
        } catch (error: any) {
          this.logger.error(`AssetCreate emit failed for asset ${asset.id}: ${error}`, error?.stack);
        }
      } else {
        await this.eventRepository.emit('AssetCreate', { asset, file });
      }

      return { id: asset.id, status: AssetMediaStatus.CREATED };
    } catch (error: any) {
      return this.handleUploadError(error, auth, file, sidecarFile, dto.stackParentId, dto.keepPrimary);
    }
  }

  private async linkToStackParent(
    ownerId: string,
    newAssetId: string,
    parentId: string,
    keepPrimary = false,
  ): Promise<{ stackId: string; created: boolean } | null> {
    if (newAssetId === parentId) {
      // duplicate upload resolving to the parent itself - linking would create
      // a one-member stack
      return null;
    }
    const result = await this.stackRepository.linkAsset(ownerId, newAssetId, parentId, keepPrimary);
    if (!result) {
      this.logger.warn(`Could not link asset ${newAssetId} to stack parent ${parentId}: parent missing or not owned`);
      return null;
    }
    await this.eventRepository.emit(result.created ? 'StackCreate' : 'StackUpdate', {
      stackId: result.stackId,
      userId: ownerId,
    });
    return result;
  }

  async downloadOriginal(auth: AuthDto, id: string, dto: AssetDownloadOriginalDto): Promise<ImmichFileResponse> {
    await this.requireAccess({ auth, permission: Permission.AssetDownload, ids: [id] });

    if (auth.sharedLink) {
      dto.edited = true;
    }

    const { originalPath, originalFileName, editedPath } = await this.assetRepository.getForOriginal(
      id,
      dto.edited ?? false,
    );

    const path = editedPath ?? originalPath!;

    return new ImmichFileResponse({
      path,
      fileName: getFileNameWithoutExtension(originalFileName) + getFilenameExtension(path),
      contentType: mimeTypes.lookup(path),
      cacheControl: CacheControl.PrivateWithCache,
    });
  }

  async viewThumbnail(
    auth: AuthDto,
    id: string,
    dto: AssetMediaOptionsDto,
  ): Promise<ImmichFileResponse | AssetMediaRedirectResponse> {
    await this.requireAccess({ auth, permission: Permission.AssetView, ids: [id] });

    if (dto.size === AssetMediaSize.Original) {
      throw new BadRequestException('May not request original file');
    }

    if (auth.sharedLink) {
      dto.edited = true;
    }

    const size = (dto.size ?? AssetMediaSize.THUMBNAIL) as unknown as AssetFileType;
    const { originalPath, originalFileName, path } = await this.assetRepository.getForThumbnail(
      id,
      size,
      dto.edited ?? false,
    );

    if (size === AssetFileType.FullSize && mimeTypes.isWebSupportedImage(originalPath) && !dto.edited) {
      // use original file for web supported images
      return { targetSize: 'original' };
    }

    if (dto.size === AssetMediaSize.FULLSIZE && !path) {
      // downgrade to preview if fullsize is not available.
      // e.g. disabled or not yet (re)generated
      return { targetSize: AssetMediaSize.PREVIEW };
    }

    if (!path) {
      throw new NotFoundException('Asset media not found');
    }

    const fileNameBase =
      auth.sharedLink && !auth.sharedLink.showExif ? id : getFileNameWithoutExtension(originalFileName);
    const fileName = `${fileNameBase}_${size}${getFilenameExtension(path)}`;

    return new ImmichFileResponse({
      fileName,
      path,
      contentType: mimeTypes.lookup(path),
      cacheControl: CacheControl.PrivateWithCache,
    });
  }

  async playbackVideo(auth: AuthDto, id: string): Promise<ImmichFileResponse> {
    await this.requireAccess({ auth, permission: Permission.AssetView, ids: [id] });

    const asset = await this.assetRepository.getForVideo(id);

    if (!asset) {
      throw new NotFoundException('Asset not found or asset is not a video');
    }

    const filepath = asset.encodedVideoPath || asset.originalPath;

    return new ImmichFileResponse({
      path: filepath,
      contentType: mimeTypes.lookup(filepath),
      cacheControl: CacheControl.PrivateWithCache,
    });
  }

  async bulkUploadCheck(auth: AuthDto, dto: AssetBulkUploadCheckDto): Promise<AssetBulkUploadCheckResponseDto> {
    const checksums: Buffer[] = dto.assets.map((asset) => fromChecksum(asset.checksum));
    const results = await this.assetRepository.getByChecksums(auth.user.id, checksums);
    const checksumMap: Record<string, { id: string; isTrashed: boolean }> = {};

    for (const { id, deletedAt, checksum } of results) {
      checksumMap[checksum.toString('hex')] = { id, isTrashed: !!deletedAt };
    }

    return {
      results: dto.assets.map(({ id, checksum }) => {
        const duplicate = checksumMap[fromChecksum(checksum).toString('hex')];
        if (duplicate) {
          return {
            id,
            action: AssetUploadAction.REJECT,
            reason: AssetRejectReason.DUPLICATE,
            assetId: duplicate.id,
            isTrashed: duplicate.isTrashed,
          };
        }

        return {
          id,
          action: AssetUploadAction.ACCEPT,
        };
      }),
    };
  }

  private async addToSharedLink(sharedLink: AuthSharedLink, assetId: string) {
    await (sharedLink.albumId
      ? this.albumRepository.addAssetIds(sharedLink.albumId, [assetId])
      : this.sharedLinkRepository.addAssets(sharedLink.id, [assetId]));
  }

  private async handleUploadError(
    error: any,
    auth: AuthDto,
    file: UploadFile,
    sidecarFile?: UploadFile,
    stackParentId?: string,
    keepPrimary?: boolean,
  ): Promise<AssetMediaResponseDto> {
    // clean up files
    await this.jobRepository.queue({
      name: JobName.FileDelete,
      data: { files: [file.originalPath, sidecarFile?.originalPath] },
    });

    // handle duplicates with a success response
    if (isAssetChecksumConstraint(error)) {
      const duplicateId = await this.assetRepository.getUploadAssetIdByChecksum(auth.user.id, file.checksum);
      if (!duplicateId) {
        this.logger.error(`Error locating duplicate for checksum constraint`);
        throw new InternalServerErrorException();
      }

      if (auth.sharedLink) {
        await this.addToSharedLink(auth.sharedLink, duplicateId);
      }

      if (stackParentId) {
        // Adopt the existing duplicate into the stack so a re-uploaded edit still
        // stacks instead of silently staying separate. A link failure shouldn't
        // turn the duplicate response into a 500 - the asset exists either way.
        try {
          await this.linkToStackParent(auth.user.id, duplicateId, stackParentId, keepPrimary);
        } catch (error: any) {
          this.logger.error(`Failed to stack duplicate ${duplicateId}: ${error}`, error?.stack);
        }
      }

      this.logger.debug(`Duplicate asset upload rejected: existing asset ${duplicateId}`);
      return { status: AssetMediaStatus.DUPLICATE, id: duplicateId };
    }

    this.logger.error(`Error uploading file ${error}`, error?.stack);
    throw error;
  }

  private async create(ownerId: string, dto: AssetMediaCreateDto, file: UploadFile, sidecarFile?: UploadFile) {
    const asset = await this.assetRepository.create({
      ownerId,
      libraryId: null,

      checksum: file.checksum,
      checksumAlgorithm: ChecksumAlgorithm.sha1File,
      originalPath: file.originalPath,

      fileCreatedAt: dto.fileCreatedAt,
      fileModifiedAt: dto.fileModifiedAt,
      localDateTime: dto.fileCreatedAt,

      type: mimeTypes.assetType(file.originalPath),
      isFavorite: dto.isFavorite,
      duration: dto.duration || null,
      visibility: dto.visibility ?? AssetVisibility.Timeline,
      livePhotoVideoId: dto.livePhotoVideoId,
      originalFileName: dto.filename || file.originalName,
    });

    if (dto.metadata?.length) {
      await this.assetRepository.upsertMetadata(asset.id, dto.metadata);
    }

    if (sidecarFile) {
      await this.assetRepository.upsertFile({
        assetId: asset.id,
        path: sidecarFile.originalPath,
        type: AssetFileType.Sidecar,
      });
      await this.storageRepository.utimes(sidecarFile.originalPath, new Date(), new Date(dto.fileModifiedAt));
    }
    await this.storageRepository.utimes(file.originalPath, new Date(), new Date(dto.fileModifiedAt));
    await this.assetRepository.upsertExif({
      exif: { assetId: asset.id, fileSizeInByte: file.size },
      lockedPropertiesBehavior: 'override',
    });

    await this.jobRepository.queue({ name: JobName.AssetExtractMetadata, data: { id: asset.id, source: 'upload' } });

    return asset;
  }

  private requireQuota(auth: AuthDto, size: number) {
    if (auth.user.quotaSizeInBytes !== null && auth.user.quotaSizeInBytes < auth.user.quotaUsageInBytes + size) {
      throw new BadRequestException('Quota has been exceeded!');
    }
  }
}
