import { Injectable } from '@nestjs/common';
import { OnJob } from 'src/decorators';
import { AssetFileType, JobName, JobStatus, QueueName, StorageBackend, StorageLocationType } from 'src/enum';
import { S3StorageAdapter } from 'src/repositories/storage';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';
import { mimeTypes } from 'src/utils/mime-types';
import { classifyS3Error, S3ErrorType } from 'src/utils/s3-error';

/**
 * Result of an asset file upload attempt.
 */
type UploadResult = { success: true } | { success: false; failed: true };

/**
 * S3StorageService - S3 Operations Layer
 *
 * Responsibilities:
 * - Asset uploads to S3 (originals, thumbnails, encoded videos)
 * - Storage class migration
 * - Orphan scanning and cleanup
 * - S3 file deletion
 *
 * When to use: Any S3-specific operation that runs as a queued job.
 * For presigned URLs, use PresignedUrlService instead.
 */
@Injectable()
export class S3StorageService extends BaseService {
  /**
   * Unified S3 object deletion with consistent error handling.
   * All S3 deletion operations should use this method.
   */
  private async deleteS3Object(adapter: S3StorageAdapter, key: string, context: string): Promise<boolean> {
    try {
      await adapter.delete(key);
      this.logger.debug(`Deleted S3 object for ${context}: ${key}`);
      return true;
    } catch (error) {
      const errorType = classifyS3Error(error);
      if (errorType === S3ErrorType.Permanent) {
        // Object doesn't exist or access denied - log but consider it handled
        this.logger.warn(`Permanent error deleting S3 object for ${context} (${key}): ${error}`);
      } else {
        // Transient error - log as error
        this.logger.error(`Failed to delete S3 object for ${context} (${key}): ${error}`);
      }
      return false;
    }
  }

  /**
   * Upload an asset file to S3 with verification and cleanup.
   * Handles the common pattern: upload -> verify -> update db -> cleanup on failure.
   */
  private async uploadAssetFileToS3(options: {
    assetId: string;
    fileType: AssetFileType;
    localPath: string;
    s3Key: string;
    s3Adapter: S3StorageAdapter;
    bucket: string;
    storageClass: string | undefined;
    contentType: string;
    deleteLocalAfterUpload: boolean;
  }): Promise<UploadResult> {
    const {
      assetId,
      fileType,
      localPath,
      s3Key,
      s3Adapter,
      bucket,
      storageClass,
      contentType,
      deleteLocalAfterUpload,
    } = options;
    const localAdapter = this.s3Manager.getLocalAdapter();
    const fileTypeName = fileType === AssetFileType.Thumbnail ? 'thumbnail' : 'preview';

    // Check if local file exists
    const localFileExists = await localAdapter.exists(localPath);
    if (!localFileExists) {
      // Check if already in S3
      try {
        const s3Exists = await s3Adapter.exists(s3Key);
        if (s3Exists) {
          this.logger.debug(`${fileTypeName} ${assetId} local file missing but already in S3, marking as uploaded`);
          await this.assetRepository.upsertFileWithS3({
            assetId,
            type: fileType,
            path: localPath,
            storageBackend: StorageBackend.S3,
            s3Bucket: bucket,
            s3Key,
          });
          return { success: true };
        }
      } catch (s3Error) {
        this.logger.warn(`S3 existence check failed for ${fileTypeName} ${assetId}: ${s3Error}`);
      }
      this.logger.warn(`Local ${fileTypeName} not found for asset ${assetId}: ${localPath}`);
      return { success: false, failed: true };
    }

    // Upload to S3
    this.logger.log(`Uploading ${fileTypeName} for asset ${assetId} to S3 bucket ${bucket}: ${s3Key}`);
    const { stream: readStream } = await localAdapter.readStream(localPath);
    await s3Adapter.writeStreamAsync(s3Key, readStream, { contentType, storageClass });

    // Verify upload size
    const s3Stat = await s3Adapter.stat(s3Key);
    const localStat = await localAdapter.stat(localPath);
    if (s3Stat.size !== localStat.size) {
      throw new Error(`Size mismatch after ${fileTypeName} S3 upload: local=${localStat.size}, s3=${s3Stat.size}`);
    }

    // Update database with compensation for failures
    try {
      await this.assetRepository.upsertFileWithS3({
        assetId,
        type: fileType,
        path: localPath,
        storageBackend: StorageBackend.S3,
        s3Bucket: bucket,
        s3Key,
      });
    } catch (dbError) {
      this.logger.error(`Database update failed for ${fileTypeName} ${assetId}, cleaning up S3 object: ${dbError}`);
      await this.deleteS3Object(s3Adapter, s3Key, `orphaned ${fileTypeName} for asset ${assetId}`);
      throw dbError;
    }

    // Delete local file after successful upload
    if (deleteLocalAfterUpload) {
      try {
        await localAdapter.delete(localPath);
        this.logger.debug(`Deleted local ${fileTypeName} for asset ${assetId}`);
      } catch (error) {
        this.logger.warn(`Failed to delete local ${fileTypeName}: ${error}`);
      }
    }

    this.logger.log(`Successfully uploaded ${fileTypeName} for asset ${assetId} to S3`);
    return { success: true };
  }

  /**
   * Handle uploading a single asset's original file to S3.
   * This is called after thumbnail generation is complete.
   */
  @OnJob({ name: JobName.S3UploadAsset, queue: QueueName.S3Upload })
  async handleS3UploadAsset(job: JobOf<JobName.S3UploadAsset>): Promise<JobStatus> {
    const { id } = job;

    const s3Manager = this.s3Manager;

    // Check if S3 is enabled for originals
    if (!(await s3Manager.isS3EnabledForLocation(StorageLocationType.Originals))) {
      this.logger.debug(`S3 upload skipped for asset ${id}: S3 not enabled for originals`);
      return JobStatus.Success;
    }

    const asset = await this.assetRepository.getById(id);
    if (!asset) {
      this.logger.warn(`Asset not found for S3 upload: ${id}`);
      return JobStatus.Failed;
    }

    // Skip if already in S3
    if (asset.storageBackend === StorageBackend.S3) {
      this.logger.debug(`Asset ${id} is already in S3, skipping upload`);
      return JobStatus.Success;
    }

    try {
      // Get the resolved S3 config for originals (includes correct bucket, adapter, storage class)
      const {
        adapter: s3Adapter,
        bucket,
        storageClass,
      } = await s3Manager.getConfigForLocation(StorageLocationType.Originals);
      const localAdapter = this.s3Manager.getLocalAdapter();
      const config = await this.getConfig({ withCache: true });

      // Generate S3 key
      const s3Key = this.generateS3Key(asset.ownerId, asset.id, asset.originalPath);

      // Check if local file exists before attempting upload
      const localFileExists = await localAdapter.exists(asset.originalPath);
      if (!localFileExists) {
        // File may have been deleted by a previous successful upload
        // Check if already in S3
        try {
          const s3Exists = await s3Adapter.exists(s3Key);
          if (s3Exists) {
            this.logger.debug(`Asset ${id} local file missing but already in S3, marking as uploaded`);
            await this.assetRepository.update({
              id: asset.id,
              storageBackend: StorageBackend.S3,
              s3Bucket: bucket,
              s3Key,
            });
            return JobStatus.Success;
          }
        } catch (s3Error) {
          this.logger.warn(`S3 existence check failed for asset ${id}: ${s3Error}`);
        }
        this.logger.warn(`Local file not found for asset ${id}: ${asset.originalPath}`);
        return JobStatus.Failed;
      }

      this.logger.log(`Uploading asset ${id} to S3 bucket ${bucket}: ${s3Key}`);

      // Stream from local storage to S3
      const { stream: readStream } = await localAdapter.readStream(asset.originalPath);

      // Upload to S3 with appropriate storage class based on asset type
      await s3Adapter.writeStreamAsync(s3Key, readStream, {
        contentType: mimeTypes.lookup(asset.originalPath),
        storageClass,
      });
      this.logger.debug(`Using storage class ${storageClass} for asset ${id}`);

      // Verify upload
      const s3Stat = await s3Adapter.stat(s3Key);
      const localStat = await localAdapter.stat(asset.originalPath);

      if (s3Stat.size !== localStat.size) {
        throw new Error(`Size mismatch after S3 upload: local=${localStat.size}, s3=${s3Stat.size}`);
      }

      // Update database with S3 location - with compensation for failures
      try {
        await this.assetRepository.update({
          id: asset.id,
          storageBackend: StorageBackend.S3,
          s3Bucket: bucket,
          s3Key,
        });
      } catch (dbError) {
        // Database update failed - delete the orphaned S3 object to maintain consistency
        this.logger.error(`Database update failed for asset ${id}, cleaning up S3 object: ${dbError}`);
        await this.deleteS3Object(s3Adapter, s3Key, `orphaned asset ${id}`);
        throw dbError; // Re-throw to trigger retry
      }

      this.logger.log(`Successfully uploaded asset ${id} to S3`);

      // Optionally delete local file after successful upload
      if (config.storage.upload.deleteLocalAfterUpload) {
        try {
          await localAdapter.delete(asset.originalPath);
          this.logger.debug(`Deleted local file for asset ${id}: ${asset.originalPath}`);
        } catch (error) {
          this.logger.warn(`Failed to delete local file after S3 upload: ${error}`);
          // Don't fail the job if local delete fails
        }
      }

      return JobStatus.Success;
    } catch (error) {
      const errorType = classifyS3Error(error);
      if (errorType === S3ErrorType.Permanent) {
        this.logger.error(`Permanent S3 error for asset ${id}, will not retry: ${error}`);
        return JobStatus.Skipped; // Don't retry permanent errors
      } else {
        this.logger.warn(`Transient S3 error for asset ${id}, will retry: ${error}`);
        return JobStatus.Failed;
      }
    }
  }

  /**
   * Queue all local assets for S3 upload.
   */
  @OnJob({ name: JobName.S3UploadQueueAll, queue: QueueName.S3Upload })
  async handleS3UploadQueueAll(): Promise<JobStatus> {
    const s3Manager = this.s3Manager;

    if (!(await s3Manager.isS3EnabledForLocation(StorageLocationType.Originals))) {
      this.logger.log('S3 upload queue all skipped: S3 not enabled for originals');
      return JobStatus.Success;
    }

    this.logger.log('Queueing all local assets for S3 upload');

    // Get all assets that are still in local storage
    const assets = await this.assetRepository.getByStorageBackend(StorageBackend.Local);

    let queued = 0;
    for (const asset of assets) {
      await this.jobRepository.queue({
        name: JobName.S3UploadAsset,
        data: { id: asset.id },
      });
      queued++;
    }

    this.logger.log(`Queued ${queued} assets for S3 upload`);
    return JobStatus.Success;
  }

  /**
   * Migrate a single asset's storage class in S3.
   * This copies the object in-place with the new storage class.
   */
  @OnJob({ name: JobName.S3MigrateStorageClass, queue: QueueName.S3Upload })
  async handleS3MigrateStorageClass(job: JobOf<JobName.S3MigrateStorageClass>): Promise<JobStatus> {
    const { id } = job;
    const s3Manager = this.s3Manager;

    if (!(await s3Manager.isS3Enabled())) {
      return JobStatus.Success;
    }

    const asset = await this.assetRepository.getById(id);
    if (!asset || asset.storageBackend !== StorageBackend.S3 || !asset.s3Key) {
      this.logger.debug(`Skipping storage class migration for asset ${id}: not in S3`);
      return JobStatus.Success;
    }

    try {
      const { adapter: s3Adapter, storageClass: targetClass } = await s3Manager.getConfigForLocation(
        StorageLocationType.Originals,
      );

      this.logger.log(`Migrating asset ${id} to storage class ${targetClass}`);

      // Copy object in-place with new storage class
      await s3Adapter.copyWithStorageClass(asset.s3Key, targetClass || 'STANDARD');

      this.logger.log(`Successfully migrated asset ${id} to storage class ${targetClass}`);
      return JobStatus.Success;
    } catch (error) {
      this.logger.error(`Failed to migrate storage class for asset ${id}: ${error}`);
      return JobStatus.Failed;
    }
  }

  /**
   * Queue all S3 assets for storage class migration.
   */
  @OnJob({ name: JobName.S3MigrateStorageClassAll, queue: QueueName.S3Upload })
  async handleS3MigrateStorageClassAll(): Promise<JobStatus> {
    const s3Manager = this.s3Manager;

    if (!(await s3Manager.isS3Enabled())) {
      this.logger.log('S3 storage class migration skipped: S3 not enabled');
      return JobStatus.Success;
    }

    this.logger.log('Queueing all S3 assets for storage class migration');

    const assets = await this.assetRepository.getByStorageBackend(StorageBackend.S3);

    let queued = 0;
    for (const asset of assets) {
      await this.jobRepository.queue({
        name: JobName.S3MigrateStorageClass,
        data: { id: asset.id },
      });
      queued++;
    }

    this.logger.log(`Queued ${queued} assets for storage class migration`);
    return JobStatus.Success;
  }

  /**
   * Handle uploading a single asset's encoded video to S3.
   * This is called after video transcoding is complete.
   */
  @OnJob({ name: JobName.S3UploadEncodedVideo, queue: QueueName.S3Upload })
  async handleS3UploadEncodedVideo(job: JobOf<JobName.S3UploadEncodedVideo>): Promise<JobStatus> {
    const { id } = job;

    const s3Manager = this.s3Manager;

    // Check if S3 is enabled for encoded videos
    if (!(await s3Manager.isS3EnabledForLocation(StorageLocationType.EncodedVideos))) {
      this.logger.debug(`S3 upload skipped for encoded video ${id}: S3 not enabled for encoded videos`);
      return JobStatus.Success;
    }

    const asset = await this.assetRepository.getById(id);
    if (!asset) {
      this.logger.warn(`Asset not found for encoded video S3 upload: ${id}`);
      return JobStatus.Failed;
    }

    // Skip if no encoded video exists
    if (!asset.encodedVideoPath) {
      this.logger.debug(`Asset ${id} has no encoded video, skipping S3 upload`);
      return JobStatus.Success;
    }

    // Skip if already uploaded to S3
    if (asset.s3KeyEncodedVideo) {
      this.logger.debug(`Encoded video for asset ${id} is already in S3, skipping upload`);
      return JobStatus.Success;
    }

    try {
      // Get the resolved S3 config for encoded videos
      const {
        adapter: s3Adapter,
        bucket,
        storageClass,
      } = await s3Manager.getConfigForLocation(StorageLocationType.EncodedVideos);
      const localAdapter = this.s3Manager.getLocalAdapter();
      const config = await this.getConfig({ withCache: true });

      // Generate S3 key for encoded video
      const s3Key = this.generateEncodedVideoS3Key(asset.ownerId, asset.id);

      // Check if local file exists
      const localFileExists = await localAdapter.exists(asset.encodedVideoPath);
      if (!localFileExists) {
        // Check if already in S3
        try {
          const s3Exists = await s3Adapter.exists(s3Key);
          if (s3Exists) {
            this.logger.debug(`Encoded video ${id} local file missing but already in S3, marking as uploaded`);
            await this.assetRepository.update({
              id: asset.id,
              s3KeyEncodedVideo: s3Key,
              s3BucketEncodedVideo: bucket,
            });
            return JobStatus.Success;
          }
        } catch (s3Error) {
          this.logger.warn(`S3 existence check failed for encoded video ${id}: ${s3Error}`);
        }
        this.logger.warn(`Local encoded video not found for asset ${id}: ${asset.encodedVideoPath}`);
        return JobStatus.Failed;
      }

      this.logger.log(`Uploading encoded video for asset ${id} to S3 bucket ${bucket}: ${s3Key}`);

      // Stream from local storage to S3
      const { stream: readStream } = await localAdapter.readStream(asset.encodedVideoPath);

      // Upload to S3 with appropriate storage class
      await s3Adapter.writeStreamAsync(s3Key, readStream, {
        contentType: 'video/mp4',
        storageClass,
      });
      this.logger.debug(`Using storage class ${storageClass} for encoded video ${id}`);

      // Verify upload
      const s3Stat = await s3Adapter.stat(s3Key);
      const localStat = await localAdapter.stat(asset.encodedVideoPath);

      if (s3Stat.size !== localStat.size) {
        throw new Error(`Size mismatch after S3 upload: local=${localStat.size}, s3=${s3Stat.size}`);
      }

      // Update database with S3 key and bucket for encoded video - with compensation for failures
      try {
        await this.assetRepository.update({
          id: asset.id,
          s3KeyEncodedVideo: s3Key,
          s3BucketEncodedVideo: bucket,
        });
      } catch (dbError) {
        // Database update failed - delete the orphaned S3 object to maintain consistency
        this.logger.error(`Database update failed for encoded video ${id}, cleaning up S3 object: ${dbError}`);
        await this.deleteS3Object(s3Adapter, s3Key, `orphaned encoded video ${id}`);
        throw dbError; // Re-throw to trigger retry
      }

      this.logger.log(`Successfully uploaded encoded video for asset ${id} to S3`);

      // Optionally delete local encoded video after successful upload
      if (config.storage.upload.deleteLocalAfterUpload) {
        try {
          await localAdapter.delete(asset.encodedVideoPath);
          await this.assetRepository.update({
            id: asset.id,
            encodedVideoPath: null,
          });
          this.logger.debug(`Deleted local encoded video for asset ${id}: ${asset.encodedVideoPath}`);
        } catch (error) {
          this.logger.warn(`Failed to delete local encoded video after S3 upload: ${error}`);
        }
      }

      return JobStatus.Success;
    } catch (error) {
      const errorType = classifyS3Error(error);
      if (errorType === S3ErrorType.Permanent) {
        this.logger.error(`Permanent S3 error for encoded video ${id}, will not retry: ${error}`);
        return JobStatus.Skipped; // Don't retry permanent errors
      } else {
        this.logger.warn(`Transient S3 error for encoded video ${id}, will retry: ${error}`);
        return JobStatus.Failed;
      }
    }
  }

  /**
   * Queue all local encoded videos for S3 upload.
   */
  @OnJob({ name: JobName.S3UploadEncodedVideoQueueAll, queue: QueueName.S3Upload })
  async handleS3UploadEncodedVideoQueueAll(): Promise<JobStatus> {
    const s3Manager = this.s3Manager;

    if (!(await s3Manager.isS3EnabledForLocation(StorageLocationType.EncodedVideos))) {
      this.logger.log('S3 encoded video upload queue all skipped: S3 not enabled for encoded videos');
      return JobStatus.Success;
    }

    this.logger.log('Queueing all local encoded videos for S3 upload');

    // Get all assets with local encoded videos that haven't been uploaded to S3
    const assets = await this.assetRepository.getWithLocalEncodedVideos();

    let queued = 0;
    for (const asset of assets) {
      await this.jobRepository.queue({
        name: JobName.S3UploadEncodedVideo,
        data: { id: asset.id },
      });
      queued++;
    }

    this.logger.log(`Queued ${queued} encoded videos for S3 upload`);
    return JobStatus.Success;
  }

  /**
   * Handle uploading a single asset's thumbnails and previews to S3.
   * This is called after thumbnail generation is complete.
   */
  @OnJob({ name: JobName.S3UploadThumbnails, queue: QueueName.S3Upload })
  async handleS3UploadThumbnails(job: JobOf<JobName.S3UploadThumbnails>): Promise<JobStatus> {
    const { id } = job;

    const s3Manager = this.s3Manager;

    // Check if S3 is enabled for thumbnails or previews
    const uploadThumbnails = await s3Manager.isS3EnabledForLocation(StorageLocationType.Thumbnails);
    const uploadPreviews = await s3Manager.isS3EnabledForLocation(StorageLocationType.Previews);

    if (!uploadThumbnails && !uploadPreviews) {
      this.logger.debug(`S3 upload skipped for thumbnails ${id}: S3 not enabled for thumbnails/previews`);
      return JobStatus.Success;
    }

    const asset = await this.assetRepository.getById(id, { files: true });
    if (!asset) {
      this.logger.warn(`Asset not found for thumbnail S3 upload: ${id}`);
      return JobStatus.Failed;
    }

    try {
      const config = await this.getConfig({ withCache: true });
      const deleteLocalAfterUpload = config.storage.upload.deleteLocalAfterUpload;

      // Process thumbnails
      if (uploadThumbnails) {
        const {
          adapter: s3Adapter,
          bucket,
          storageClass,
        } = await s3Manager.getConfigForLocation(StorageLocationType.Thumbnails);
        const thumbnailFile = asset.files?.find((f: { type: string }) => f.type === 'thumbnail');

        if (thumbnailFile && thumbnailFile.storageBackend !== StorageBackend.S3) {
          const result = await this.uploadAssetFileToS3({
            assetId: asset.id,
            fileType: AssetFileType.Thumbnail,
            localPath: thumbnailFile.path,
            s3Key: this.generateThumbnailS3Key(asset.ownerId, asset.id, 'thumbnail.webp'),
            s3Adapter,
            bucket,
            storageClass,
            contentType: 'image/webp',
            deleteLocalAfterUpload,
          });
          if (!result.success) {
            return JobStatus.Failed;
          }
        }
      }

      // Process previews
      if (uploadPreviews) {
        const {
          adapter: s3Adapter,
          bucket,
          storageClass,
        } = await s3Manager.getConfigForLocation(StorageLocationType.Previews);
        const previewFile = asset.files?.find((f: { type: string }) => f.type === 'preview');

        if (previewFile && previewFile.storageBackend !== StorageBackend.S3) {
          const result = await this.uploadAssetFileToS3({
            assetId: asset.id,
            fileType: AssetFileType.Preview,
            localPath: previewFile.path,
            s3Key: this.generateThumbnailS3Key(asset.ownerId, asset.id, 'preview.webp'),
            s3Adapter,
            bucket,
            storageClass,
            contentType: 'image/webp',
            deleteLocalAfterUpload,
          });
          if (!result.success) {
            return JobStatus.Failed;
          }
        }
      }

      return JobStatus.Success;
    } catch (error) {
      const errorType = classifyS3Error(error);
      if (errorType === S3ErrorType.Permanent) {
        this.logger.error(`Permanent S3 error for thumbnails ${id}, will not retry: ${error}`);
        return JobStatus.Skipped;
      } else {
        this.logger.warn(`Transient S3 error for thumbnails ${id}, will retry: ${error}`);
        return JobStatus.Failed;
      }
    }
  }

  /**
   * Queue all assets with local thumbnails for S3 upload.
   */
  @OnJob({ name: JobName.S3UploadThumbnailsQueueAll, queue: QueueName.S3Upload })
  async handleS3UploadThumbnailsQueueAll(): Promise<JobStatus> {
    const s3Manager = this.s3Manager;

    const uploadThumbnails = await s3Manager.isS3EnabledForLocation(StorageLocationType.Thumbnails);
    const uploadPreviews = await s3Manager.isS3EnabledForLocation(StorageLocationType.Previews);

    if (!uploadThumbnails && !uploadPreviews) {
      this.logger.log('S3 thumbnail upload queue all skipped: S3 not enabled for thumbnails/previews');
      return JobStatus.Success;
    }

    this.logger.log('Queueing all assets with local thumbnails for S3 upload');

    // Get all assets that have local thumbnails/previews
    const assets = await this.assetRepository.getWithLocalThumbnails();

    let queued = 0;
    for (const asset of assets) {
      await this.jobRepository.queue({
        name: JobName.S3UploadThumbnails,
        data: { id: asset.id },
      });
      queued++;
    }

    this.logger.log(`Queued ${queued} assets for thumbnail S3 upload`);
    return JobStatus.Success;
  }

  /**
   * Generate S3 key for an asset original.
   * Format: users/{userId}/{assetId}/original.{ext}
   */
  private generateS3Key(userId: string, assetId: string, originalPath: string): string {
    // Extract extension properly - only consider it an extension if there's a dot in the filename
    const filename = originalPath.split('/').pop() || '';
    const lastDotIndex = filename.lastIndexOf('.');
    // Only treat as extension if dot is not at start (hidden files) and not the only character
    const ext = lastDotIndex > 0 ? filename.slice(Math.max(0, lastDotIndex + 1)) : '';
    // Sanitize extension - only allow alphanumeric chars
    const sanitizedExt = ext.replaceAll(/[^a-zA-Z0-9]/g, '');
    // If no extension, use 'bin' as a fallback
    const safeExt = sanitizedExt || 'bin';
    return `users/${userId}/${assetId}/original.${safeExt}`;
  }

  /**
   * Generate S3 key for an encoded video.
   * Format: users/{userId}/{assetId}/encoded.mp4
   */
  private generateEncodedVideoS3Key(userId: string, assetId: string): string {
    return `users/${userId}/${assetId}/encoded.mp4`;
  }

  /**
   * Generate S3 key for a thumbnail or preview.
   * Format: users/{userId}/{assetId}/{filename}
   */
  private generateThumbnailS3Key(userId: string, assetId: string, filename: string): string {
    return `users/${userId}/${assetId}/${filename}`;
  }

  /**
   * Clean up orphaned local files for assets that have been uploaded to S3.
   * This handles the case where the process crashed after S3 upload but before local delete.
   */
  @OnJob({ name: JobName.S3CleanupOrphanedFiles, queue: QueueName.S3Upload })
  async handleS3CleanupOrphanedFiles(): Promise<JobStatus> {
    const config = await this.getConfig({ withCache: true });
    const s3Manager = this.s3Manager;

    if (!(await s3Manager.isS3Enabled())) {
      this.logger.log('S3 orphaned files cleanup skipped: S3 not enabled');
      return JobStatus.Success;
    }

    if (!config.storage.upload.deleteLocalAfterUpload) {
      this.logger.log('S3 orphaned files cleanup skipped: deleteLocalAfterUpload is disabled');
      return JobStatus.Success;
    }

    this.logger.log('Starting S3 orphaned files cleanup');

    const localAdapter = this.s3Manager.getLocalAdapter();
    let cleanedCount = 0;
    let errorCount = 0;

    // Stream through S3 assets that still have local paths
    for await (const asset of this.assetRepository.getS3AssetsWithLocalPaths()) {
      try {
        const localFileExists = await localAdapter.exists(asset.originalPath);
        if (localFileExists) {
          this.logger.debug(`Deleting orphaned local file for S3 asset ${asset.id}: ${asset.originalPath}`);
          await localAdapter.delete(asset.originalPath);
          cleanedCount++;
        }
      } catch (error) {
        this.logger.warn(`Failed to clean up orphaned file for asset ${asset.id}: ${error}`);
        errorCount++;
      }
    }

    this.logger.log(`S3 orphaned files cleanup complete: ${cleanedCount} files deleted, ${errorCount} errors`);
    return JobStatus.Success;
  }

  /**
   * Scan S3 buckets for orphaned objects (objects without corresponding DB records).
   * This handles the case where DB records were deleted but S3 deletion failed.
   * Run periodically (weekly/monthly) to clean up orphaned storage.
   */
  @OnJob({ name: JobName.S3OrphanScanner, queue: QueueName.BackgroundTask })
  async handleS3OrphanScanner(): Promise<JobStatus> {
    const s3Manager = this.s3Manager;

    if (!(await s3Manager.isS3Enabled())) {
      this.logger.log('S3 orphan scanner skipped: S3 not enabled');
      return JobStatus.Success;
    }

    this.logger.log('Starting S3 orphan scanner');

    let orphanedCount = 0;
    let scannedCount = 0;
    let errorCount = 0;

    try {
      // Scan the main originals location
      const s3Adapter = await s3Manager.getDefaultAdapter();
      if (!s3Adapter) {
        this.logger.warn('S3 orphan scanner: No default S3 adapter available');
        return JobStatus.Success;
      }

      // List all objects under the users/ prefix
      const objects = await s3Adapter.listObjects('users/');

      for (const obj of objects) {
        scannedCount++;

        // Extract asset ID from the key
        // Expected format: users/{userId}/{assetId}/original.{ext}
        const assetId = this.extractAssetIdFromKey(obj.key);
        if (!assetId) {
          continue;
        }

        try {
          const asset = await this.assetRepository.getById(assetId);
          if (!asset) {
            this.logger.warn(`S3 orphan detected: ${obj.key} (no DB record for asset ${assetId})`);
            orphanedCount++;

            // Note: We log orphans but don't auto-delete for safety.
            // To enable auto-delete, uncomment below and add config option:
            // await s3Adapter.delete(obj.key);
            // this.logger.log(`Deleted orphaned S3 object: ${obj.key}`);
          }
        } catch (error) {
          this.logger.debug(`Error checking asset ${assetId}: ${error}`);
          errorCount++;
        }

        // Log progress every 1000 objects
        if (scannedCount % 1000 === 0) {
          this.logger.log(
            `S3 orphan scanner progress: ${scannedCount} objects scanned, ${orphanedCount} orphans found`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`S3 orphan scanner error: ${error}`);
      return JobStatus.Failed;
    }

    this.logger.log(
      `S3 orphan scanner complete: ${scannedCount} objects scanned, ${orphanedCount} orphans found, ${errorCount} errors`,
    );
    return JobStatus.Success;
  }

  /**
   * Extract asset ID from an S3 object key.
   * Expected format: users/{userId}/{assetId}/original.{ext} or users/{userId}/{assetId}/{filename}
   */
  private extractAssetIdFromKey(key: string): string | null {
    // Format: users/{userId}/{assetId}/...
    const parts = key.split('/');
    if (parts.length >= 3 && parts[0] === 'users') {
      const potentialAssetId = parts[2];
      // UUID format validation (loose check)
      if (potentialAssetId && potentialAssetId.length === 36 && potentialAssetId.includes('-')) {
        return potentialAssetId;
      }
    }
    return null;
  }

  /**
   * Handle deletion of S3 files.
   * Called when assets are permanently deleted.
   */
  @OnJob({ name: JobName.S3FileDelete, queue: QueueName.S3Upload })
  async handleS3FileDelete(job: JobOf<JobName.S3FileDelete>): Promise<JobStatus> {
    const { files } = job;

    if (!files || files.length === 0) {
      return JobStatus.Success;
    }

    const s3Manager = this.s3Manager;

    if (!(await s3Manager.isS3Enabled())) {
      this.logger.warn('S3 file delete called but S3 is not enabled');
      return JobStatus.Success;
    }

    let deletedCount = 0;
    let errorCount = 0;

    for (const file of files) {
      // Get adapter for the specific bucket (supports multi-bucket configurations)
      const adapter = await s3Manager.getAdapterForBucket(file.bucket);
      const success = await this.deleteS3Object(adapter, file.key, `file delete job (${file.bucket}/${file.key})`);
      if (success) {
        deletedCount++;
      } else {
        errorCount++;
      }
    }

    this.logger.log(`S3 file delete complete: ${deletedCount} deleted, ${errorCount} errors`);
    return JobStatus.Success;
  }
}
