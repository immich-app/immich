import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { extname } from 'node:path';
import Redis from 'ioredis';
import sanitize from 'sanitize-filename';
import { StorageCore } from 'src/cores/storage.core';
import { Asset } from 'src/database';
import {
  AssetBulkUploadCheckResponseDto,
  AssetMediaResponseDto,
  AssetMediaStatus,
  AssetRejectReason,
  AssetUploadAction,
  CheckExistingAssetsResponseDto,
} from 'src/dtos/asset-media-response.dto';
import {
  AssetBulkUploadCheckDto,
  AssetMediaCreateDto,
  AssetMediaOptionsDto,
  AssetMediaReplaceDto,
  AssetMediaSize,
  CheckExistingAssetsDto,
  UploadFieldName,
} from 'src/dtos/asset-media.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  AssetFileType,
  AssetStatus,
  AssetType,
  AssetVisibility,
  CacheControl,
  JobName,
  Permission,
  StorageBackend,
  StorageFolder,
  StorageLocationType,
} from 'src/enum';
import { AuthRequest } from 'src/middleware/auth.guard';
import { BaseService } from 'src/services/base.service';
import { UploadFile, UploadRequest } from 'src/types';
import { requireUploadAccess } from 'src/utils/access';
import { asUploadRequest, getAssetFiles, onBeforeLink } from 'src/utils/asset.util';
import { isAssetChecksumConstraint } from 'src/utils/database';
import { EncryptionInfo, getFilenameExtension, getFileNameWithoutExtension, ImmichFileResponse } from 'src/utils/file';
import { mimeTypes } from 'src/utils/mime-types';
import { fromChecksum } from 'src/utils/request';

export interface AssetMediaRedirectResponse {
  targetSize: AssetMediaSize | 'original';
}

// Redis key prefixes for upload rate tracking (used by autoscaler)
const UPLOAD_COUNTER_KEY_PREFIX = 'immich:scaling:uploads:';
const VIDEO_UPLOAD_COUNTER_KEY_PREFIX = 'immich:scaling:video-uploads:';
const UPLOADERS_KEY_PREFIX = 'immich:scaling:uploaders:';
const UPLOAD_COUNTER_TTL_SECONDS = 180; // 3 minutes (covers 2-min window + buffer)

@Injectable()
export class AssetMediaService extends BaseService {
  private redis?: Redis;

  /**
   * Get Redis client for upload rate tracking (lazy initialized)
   */
  private async getRedis(): Promise<Redis> {
    if (!this.redis) {
      const { redis } = this.configRepository.getEnv();
      this.redis = new Redis({ ...redis, lazyConnect: true });
      await this.redis.connect();
    }
    return this.redis;
  }

  /**
   * Increment upload counter for autoscaler rate-based scaling.
   * Uses minute buckets with TTL for sliding window calculation.
   * Videos are tracked separately as they consume more resources.
   * Unique uploaders are tracked to scale based on concurrent users.
   */
  private async trackUploadForScaling(userId: string, isVideo: boolean): Promise<void> {
    try {
      const redis = await this.getRedis();
      const bucket = Math.floor(Date.now() / 60_000); // minute bucket

      // Always increment total uploads
      const uploadKey = `${UPLOAD_COUNTER_KEY_PREFIX}${bucket}`;
      await redis.incr(uploadKey);
      await redis.expire(uploadKey, UPLOAD_COUNTER_TTL_SECONDS);

      // Track video uploads separately for penalty calculation
      if (isVideo) {
        const videoKey = `${VIDEO_UPLOAD_COUNTER_KEY_PREFIX}${bucket}`;
        await redis.incr(videoKey);
        await redis.expire(videoKey, UPLOAD_COUNTER_TTL_SECONDS);
      }

      // Track unique uploaders per bucket (for multi-user scaling)
      const uploadersKey = `${UPLOADERS_KEY_PREFIX}${bucket}`;
      await redis.sadd(uploadersKey, userId);
      await redis.expire(uploadersKey, UPLOAD_COUNTER_TTL_SECONDS);
    } catch (error) {
      // Non-critical - log and continue (don't fail upload due to scaling metrics)
      this.logger.warn(`Failed to track upload for scaling: ${error}`);
    }
  }

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

      if (dto.livePhotoVideoId) {
        await onBeforeLink(
          { asset: this.assetRepository, event: this.eventRepository },
          { userId: auth.user.id, livePhotoVideoId: dto.livePhotoVideoId },
        );
      }
      const asset = await this.create(auth.user.id, dto, file, sidecarFile);

      await this.userRepository.updateUsage(auth.user.id, file.size);

      // Track upload for autoscaler rate-based scaling
      // Videos have duration set, photos don't
      const isVideo = dto.duration !== undefined && dto.duration !== null && dto.duration !== '';
      await this.trackUploadForScaling(auth.user.id, isVideo);

      return { id: asset.id, status: AssetMediaStatus.CREATED };
    } catch (error: any) {
      return this.handleUploadError(error, auth, file, sidecarFile);
    }
  }

  async replaceAsset(
    auth: AuthDto,
    id: string,
    dto: AssetMediaReplaceDto,
    file: UploadFile,
    sidecarFile?: UploadFile,
  ): Promise<AssetMediaResponseDto> {
    try {
      await this.requireAccess({ auth, permission: Permission.AssetUpdate, ids: [id] });
      const asset = await this.assetRepository.getById(id);

      if (!asset) {
        throw new Error('Asset not found');
      }

      this.requireQuota(auth, file.size);

      await this.replaceFileData(asset.id, dto, file, sidecarFile?.originalPath);

      // Next, create a backup copy of the existing record. The db record has already been updated above,
      // but the local variable holds the original file data paths.
      const copiedPhoto = await this.createCopy(asset);
      // and immediate trash it
      await this.assetRepository.updateAll([copiedPhoto.id], { deletedAt: new Date(), status: AssetStatus.Trashed });
      await this.eventRepository.emit('AssetTrash', { assetId: copiedPhoto.id, userId: auth.user.id });

      await this.userRepository.updateUsage(auth.user.id, file.size);

      return { status: AssetMediaStatus.REPLACED, id: copiedPhoto.id };
    } catch (error: any) {
      return this.handleUploadError(error, auth, file, sidecarFile);
    }
  }

  async downloadOriginal(auth: AuthDto, id: string): Promise<ImmichFileResponse> {
    await this.requireAccess({ auth, permission: Permission.AssetDownload, ids: [id] });

    const asset = await this.findOrFail(id);

    // Check if asset is encrypted and get decryption key
    const encryption = await this.getEncryptionInfo(auth, id);

    // Handle S3 storage - redirect to presigned URL
    if (asset.storageBackend === StorageBackend.S3 && asset.s3Key && asset.s3Bucket) {
      const s3Manager = this.s3Manager;
      if (await s3Manager.isS3Enabled()) {
        // Use the bucket stored in the database, not the default config
        const s3Adapter = await s3Manager.getAdapterForBucket(asset.s3Bucket);
        const presignedUrl = await s3Adapter.getPresignedDownloadUrl(asset.s3Key, { expiresIn: 86_400 });
        if (presignedUrl) {
          return new ImmichFileResponse({
            path: asset.originalPath, // Not used for redirect, but required by type
            fileName: asset.originalFileName,
            contentType: mimeTypes.lookup(asset.originalPath),
            cacheControl: CacheControl.PrivateWithCache,
            redirectUrl: presignedUrl,
          });
        }
      }
    }

    return new ImmichFileResponse({
      path: asset.originalPath,
      fileName: asset.originalFileName,
      contentType: mimeTypes.lookup(asset.originalPath),
      cacheControl: CacheControl.PrivateWithCache,
      encryption,
    });
  }

  async viewThumbnail(
    auth: AuthDto,
    id: string,
    dto: AssetMediaOptionsDto,
  ): Promise<ImmichFileResponse | AssetMediaRedirectResponse> {
    await this.requireAccess({ auth, permission: Permission.AssetView, ids: [id] });

    const asset = await this.findOrFail(id);
    const size = dto.size ?? AssetMediaSize.THUMBNAIL;

    const { thumbnailFile, previewFile, fullsizeFile } = getAssetFiles(asset.files ?? []);
    let filepath = previewFile?.path;
    let selectedFile = previewFile;
    if (size === AssetMediaSize.THUMBNAIL && thumbnailFile) {
      filepath = thumbnailFile.path;
      selectedFile = thumbnailFile;
    } else if (size === AssetMediaSize.FULLSIZE) {
      if (mimeTypes.isWebSupportedImage(asset.originalPath)) {
        // use original file for web supported images
        return { targetSize: 'original' };
      }
      if (!fullsizeFile) {
        // downgrade to preview if fullsize is not available.
        // e.g. disabled or not yet (re)generated
        return { targetSize: AssetMediaSize.PREVIEW };
      }
      filepath = fullsizeFile.path;
      selectedFile = fullsizeFile;
    }

    if (!filepath) {
      throw new NotFoundException('Asset media not found');
    }
    let fileName = getFileNameWithoutExtension(asset.originalFileName);
    fileName += `_${size}`;
    fileName += getFilenameExtension(filepath);

    // Check if thumbnail is in S3 and redirect to presigned URL
    if (selectedFile?.storageBackend === StorageBackend.S3 && selectedFile?.s3Key && selectedFile?.s3Bucket) {
      const s3Manager = this.s3Manager;
      if (await s3Manager.isS3Enabled()) {
        // Use the bucket stored in the database, not the default config
        const s3Adapter = await s3Manager.getAdapterForBucket(selectedFile.s3Bucket);
        const presignedUrl = await s3Adapter.getPresignedDownloadUrl(selectedFile.s3Key, { expiresIn: 86_400 });
        if (presignedUrl) {
          return new ImmichFileResponse({
            path: filepath,
            fileName,
            contentType: mimeTypes.lookup(filepath),
            cacheControl: CacheControl.PrivateWithCache,
            redirectUrl: presignedUrl,
          });
        }
      }
    }

    // Check if asset is encrypted and get decryption key
    const encryption = await this.getEncryptionInfo(auth, id);

    return new ImmichFileResponse({
      fileName,
      path: filepath,
      contentType: mimeTypes.lookup(filepath),
      cacheControl: CacheControl.PrivateWithCache,
      encryption,
    });
  }

  async playbackVideo(auth: AuthDto, id: string): Promise<ImmichFileResponse> {
    await this.requireAccess({ auth, permission: Permission.AssetView, ids: [id] });

    const asset = await this.findOrFail(id);

    if (asset.type !== AssetType.Video) {
      throw new BadRequestException('Asset is not a video');
    }

    const filepath = asset.encodedVideoPath || asset.originalPath;

    // Check if asset is encrypted and get decryption key
    const encryption = await this.getEncryptionInfo(auth, id);

    const s3Manager = this.s3Manager;

    // Handle S3 storage for encoded videos
    // Use the stored bucket if available, otherwise fall back to location config
    if (asset.s3KeyEncodedVideo && (await s3Manager.isS3Enabled())) {
      try {
        let s3Adapter;
        if (asset.s3BucketEncodedVideo) {
          s3Adapter = await s3Manager.getAdapterForBucket(asset.s3BucketEncodedVideo);
        } else {
          const config = await s3Manager.getConfigForLocation(StorageLocationType.EncodedVideos);
          s3Adapter = config.adapter;
        }
        const presignedUrl = await s3Adapter.getPresignedDownloadUrl(asset.s3KeyEncodedVideo, { expiresIn: 86_400 });
        if (presignedUrl) {
          return new ImmichFileResponse({
            path: filepath,
            fileName: asset.originalFileName,
            contentType: 'video/mp4',
            cacheControl: CacheControl.PrivateWithCache,
            redirectUrl: presignedUrl,
          });
        }
      } catch {
        // S3 not enabled for encoded videos location, fall through
      }
    }

    // Handle S3 storage for original video (when no encoded video exists)
    // Use the bucket stored in the database
    if (
      !asset.encodedVideoPath &&
      asset.storageBackend === StorageBackend.S3 &&
      asset.s3Key &&
      asset.s3Bucket &&
      (await s3Manager.isS3Enabled())
    ) {
      const s3Adapter = await s3Manager.getAdapterForBucket(asset.s3Bucket);
      const presignedUrl = await s3Adapter.getPresignedDownloadUrl(asset.s3Key, { expiresIn: 86_400 });
      if (presignedUrl) {
        return new ImmichFileResponse({
          path: filepath,
          fileName: asset.originalFileName,
          contentType: mimeTypes.lookup(filepath),
          cacheControl: CacheControl.PrivateWithCache,
          redirectUrl: presignedUrl,
        });
      }
    }

    return new ImmichFileResponse({
      path: filepath,
      contentType: mimeTypes.lookup(filepath),
      cacheControl: CacheControl.PrivateWithCache,
      encryption,
    });
  }

  async checkExistingAssets(
    auth: AuthDto,
    checkExistingAssetsDto: CheckExistingAssetsDto,
  ): Promise<CheckExistingAssetsResponseDto> {
    const existingIds = await this.assetRepository.getByDeviceIds(
      auth.user.id,
      checkExistingAssetsDto.deviceId,
      checkExistingAssetsDto.deviceAssetIds,
    );
    return { existingIds };
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

  private async handleUploadError(
    error: any,
    auth: AuthDto,
    file: UploadFile,
    sidecarFile?: UploadFile,
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
      return { status: AssetMediaStatus.DUPLICATE, id: duplicateId };
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
  private async replaceFileData(
    assetId: string,
    dto: AssetMediaReplaceDto,
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

      livePhotoVideoId: null,
    });

    await (sidecarPath
      ? this.assetRepository.upsertFile({ assetId, type: AssetFileType.Sidecar, path: sidecarPath })
      : this.assetRepository.deleteFile({ assetId, type: AssetFileType.Sidecar }));

    await this.storageRepository.utimes(file.originalPath, new Date(), new Date(dto.fileModifiedAt));
    await this.assetRepository.upsertExif(
      { assetId, fileSizeInByte: file.size },
      { lockedPropertiesBehavior: 'override' },
    );
    await this.jobRepository.queue({
      name: JobName.AssetExtractMetadata,
      data: { id: assetId, source: 'upload' },
    });
  }

  /**
   * Create a 'shallow' copy of the specified asset record creating a new asset record in the database.
   * Uses only vital properties excluding things like: stacks, faces, smart search info, etc,
   * and then queues a METADATA_EXTRACTION job.
   */
  private async createCopy(asset: Omit<Asset, 'id'>) {
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
    });

    const { size } = await this.storageRepository.stat(created.originalPath);
    await this.assetRepository.upsertExif(
      { assetId: created.id, fileSizeInByte: size },
      { lockedPropertiesBehavior: 'override' },
    );
    await this.jobRepository.queue({ name: JobName.AssetExtractMetadata, data: { id: created.id, source: 'copy' } });
    return created;
  }

  private async create(ownerId: string, dto: AssetMediaCreateDto, file: UploadFile, sidecarFile?: UploadFile) {
    const assetId = this.cryptoRepository.randomUUID();
    const localPath = file.originalPath;

    // Step 1: Upload to S3 FIRST (S3 is source of truth)
    // This ensures the file is durably stored before we create the DB record
    let s3Key: string | undefined;
    let s3Bucket: string | undefined;
    let storageBackend = StorageBackend.Local;
    let originalPathForDb = localPath;

    const s3Enabled = await this.s3Manager.isS3EnabledForLocation(StorageLocationType.Originals);
    if (s3Enabled) {
      try {
        const {
          adapter: s3Adapter,
          bucket,
          storageClass,
        } = await this.s3Manager.getConfigForLocation(StorageLocationType.Originals);

        // Generate S3 key
        const rawExt = getFilenameExtension(localPath).replaceAll('.', '') || 'bin';
        const ext = rawExt.replaceAll(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'bin';
        s3Key = `users/${ownerId}/${assetId}/original.${ext}`;

        this.logger.log(`Uploading asset ${assetId} to S3 synchronously: ${s3Key}`);

        // Stream local file to S3
        const { stream } = await this.storageRepository.createReadStream(localPath);
        try {
          await s3Adapter.writeStreamAsync(s3Key, stream, {
            contentType: mimeTypes.lookup(localPath),
            storageClass,
          });
        } finally {
          stream.destroy?.();
        }

        // Verify upload succeeded by comparing sizes
        const s3Stat = await s3Adapter.stat(s3Key);
        if (s3Stat.size !== file.size) {
          // Size mismatch - delete the corrupted S3 object and fall back to local
          this.logger.error(`S3 upload size mismatch for ${assetId}: local=${file.size}, s3=${s3Stat.size}`);
          try {
            await s3Adapter.delete(s3Key);
          } catch (deleteError) {
            this.logger.warn(`Failed to delete invalid S3 upload at ${s3Key}`, deleteError);
          }
          throw new Error(`S3 upload verification failed: expected ${file.size} bytes, got ${s3Stat.size} bytes`);
        }

        // S3 upload succeeded - use S3 as storage backend
        s3Bucket = bucket;
        storageBackend = StorageBackend.S3;
        originalPathForDb = s3Key; // Store S3 key as originalPath

        this.logger.log(`Successfully uploaded asset ${assetId} to S3`);
      } catch (error) {
        // S3 upload failed - fall back to local storage
        this.logger.warn(`S3 upload failed for ${assetId}, falling back to local storage: ${error}`);
        s3Key = undefined;
        s3Bucket = undefined;
        storageBackend = StorageBackend.Local;
        originalPathForDb = localPath;
      }
    }

    // Step 2: Create DB record with S3 path (or local path as fallback)
    const asset = await this.databaseRepository.withTransaction(async (tx) => {
      try {
        const newAsset = await this.assetRepository.create(
          {
            id: assetId,
            ownerId,
            libraryId: null,

            checksum: file.checksum,
            originalPath: originalPathForDb,

            // S3 storage fields
            storageBackend,
            s3Bucket: s3Bucket ?? null,
            s3Key: s3Key ?? null,

            deviceAssetId: dto.deviceAssetId,
            deviceId: dto.deviceId,

            fileCreatedAt: dto.fileCreatedAt,
            fileModifiedAt: dto.fileModifiedAt,
            localDateTime: dto.fileCreatedAt,

            type: mimeTypes.assetType(localPath),
            isFavorite: dto.isFavorite,
            duration: dto.duration || null,
            visibility: dto.visibility ?? AssetVisibility.Timeline,
            livePhotoVideoId: dto.livePhotoVideoId,
            originalFileName: dto.filename || file.originalName,
          },
          tx,
        );

        if (dto.metadata) {
          await this.assetRepository.upsertMetadata(newAsset.id, dto.metadata, tx);
        }

        if (sidecarFile) {
          await this.assetRepository.upsertFile(
            {
              assetId: newAsset.id,
              path: sidecarFile.originalPath,
              type: AssetFileType.Sidecar,
            },
            tx,
          );
        }

        await this.assetRepository.upsertExif(
          { assetId: newAsset.id, fileSizeInByte: file.size },
          { lockedPropertiesBehavior: 'override' },
          tx,
        );

        return newAsset;
      } catch (error) {
        // DB transaction failed - clean up S3 object if we uploaded one
        if (s3Key && s3Bucket) {
          this.logger.warn(`DB transaction failed for ${assetId}, cleaning up S3 object`);
          try {
            const s3Adapter = await this.s3Manager.getAdapterForBucket(s3Bucket);
            await s3Adapter.delete(s3Key);
          } catch (s3Error) {
            this.logger.error(`Failed to clean up S3 object ${s3Key} in bucket ${s3Bucket} after DB failure`, s3Error);
          }
        }
        throw error;
      }
    });

    // FS operations happen AFTER the transaction commits successfully
    if (sidecarFile) {
      await this.storageRepository.utimes(sidecarFile.originalPath, new Date(), new Date(dto.fileModifiedAt));
    }
    await this.storageRepository.utimes(localPath, new Date(), new Date(dto.fileModifiedAt));

    // Step 3: Queue jobs with LOCAL temp path for processing (machine affinity)
    // Jobs use the local file while it exists; it will be cleaned up after all jobs complete
    await this.eventRepository.emit('AssetCreate', { asset });
    await this.jobRepository.queue({
      name: JobName.AssetExtractMetadata,
      data: {
        id: asset.id,
        source: 'upload',
        localPath, // Pass temp file path to jobs
      },
    });

    return asset;
  }

  private requireQuota(auth: AuthDto, size: number) {
    if (auth.user.quotaSizeInBytes !== null && auth.user.quotaSizeInBytes < auth.user.quotaUsageInBytes + size) {
      throw new BadRequestException('Quota has been exceeded!');
    }
  }

  private async findOrFail(id: string) {
    const asset = await this.assetRepository.getById(id, { files: true });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    return asset;
  }

  /**
   * Get encryption info for an asset if it's encrypted.
   * Returns undefined if asset is not encrypted.
   * Throws ForbiddenException if vault is locked.
   */
  private async getEncryptionInfo(auth: AuthDto, assetId: string): Promise<EncryptionInfo | undefined> {
    // Check if asset is encrypted
    const encryptionMeta = await this.assetEncryptionRepository.getByAssetId(assetId);
    if (!encryptionMeta) {
      return undefined;
    }

    // Asset is encrypted, get vault key from session
    const vaultKey = await this.getVaultKeyFromSession(auth);
    if (!vaultKey) {
      throw new ForbiddenException('Vault is locked. Please unlock your vault to access encrypted assets.');
    }

    // Unwrap the DEK
    try {
      const dek = this.cryptoRepository.unwrapKey(encryptionMeta.wrappedDek, vaultKey);
      return { dek };
    } catch (error) {
      this.logger.error(`Failed to unwrap DEK for asset ${assetId}: ${error}`);
      throw new InternalServerErrorException('Failed to decrypt asset');
    }
  }

  /**
   * Get the vault key from the session cache.
   * Returns null if vault is not unlocked for this session.
   */
  private async getVaultKeyFromSession(auth: AuthDto): Promise<Buffer | null> {
    if (!auth.session) {
      return null;
    }

    // Get session with vault key cache
    const sessionRecord = await this.sessionRepository.update(auth.session.id, {});
    if (!sessionRecord?.encryptedVaultKeyCache || !sessionRecord.vaultKeyExpiresAt) {
      return null;
    }

    // Check if expired
    if (new Date(sessionRecord.vaultKeyExpiresAt) <= new Date()) {
      // Clear expired cache
      await this.sessionRepository.update(auth.session.id, {
        encryptedVaultKeyCache: null,
        vaultKeyExpiresAt: null,
      });
      return null;
    }

    // Decrypt vault key from cache using session-derived key
    try {
      const sessionKey = await this.deriveSessionKey(auth.session.id);
      return this.cryptoRepository.unwrapKey(sessionRecord.encryptedVaultKeyCache, sessionKey);
    } catch {
      this.logger.warn(`Failed to decrypt vault key from session cache`);
      return null;
    }
  }

  /**
   * Derive a session key from the session ID.
   */
  private async deriveSessionKey(sessionId: string): Promise<Buffer> {
    const { scryptSync } = await import('node:crypto');
    const salt = Buffer.from('immich-vault-session-key', 'utf8');
    return scryptSync(sessionId, salt, 32, {
      N: 2 ** 14,
      r: 8,
      p: 1,
    });
  }
}
