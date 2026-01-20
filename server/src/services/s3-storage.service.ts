import { Injectable } from '@nestjs/common';
import { SystemConfig } from 'src/config';
import { OnJob } from 'src/decorators';
import { AssetFileType, AssetType, JobName, JobStatus, QueueName, StorageBackend, StorageLocationType } from 'src/enum';
import { LocalStorageAdapter, S3StorageManager } from 'src/repositories/storage';
import { StorageCore } from 'src/cores/storage.core';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';
import { mimeTypes } from 'src/utils/mime-types';
import { classifyS3Error, S3ErrorType } from 'src/utils/s3-error';

/**
 * Service for handling S3 storage operations.
 * Manages uploading assets to S3 and synchronizing storage locations.
 */
@Injectable()
export class S3StorageService extends BaseService {
  private s3Manager: S3StorageManager | null = null;
  private localAdapter: LocalStorageAdapter | null = null;

  /**
   * Get or create the S3 storage manager with current config.
   */
  private async getS3Manager(): Promise<S3StorageManager> {
    const config = await this.getConfig({ withCache: true });
    if (!this.s3Manager) {
      this.s3Manager = new S3StorageManager(config.storage);
    } else {
      this.s3Manager.updateConfig(config.storage);
    }
    return this.s3Manager;
  }

  /**
   * Get the local storage adapter.
   */
  private getLocalAdapter(): LocalStorageAdapter {
    if (!this.localAdapter) {
      this.localAdapter = new LocalStorageAdapter(StorageCore.getMediaLocation());
    }
    return this.localAdapter;
  }

  /**
   * Handle uploading a single asset's original file to S3.
   * This is called after thumbnail generation is complete.
   */
  @OnJob({ name: JobName.S3UploadAsset, queue: QueueName.S3Upload })
  async handleS3UploadAsset(job: JobOf<JobName.S3UploadAsset>): Promise<JobStatus> {
    const { id } = job;

    const s3Manager = await this.getS3Manager();

    // Check if S3 is enabled for originals
    if (!s3Manager.isS3EnabledForLocation(StorageLocationType.Originals)) {
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
      const { adapter: s3Adapter, bucket, storageClass } = s3Manager.getConfigForLocation(
        StorageLocationType.Originals,
        asset.type,
      );
      const localAdapter = this.getLocalAdapter();
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
        } catch {
          // S3 check failed, log and fail the job
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

      // Update database with S3 location
      await this.assetRepository.update({
        id: asset.id,
        storageBackend: StorageBackend.S3,
        s3Bucket: bucket,
        s3Key,
      });

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
      } else {
        this.logger.warn(`Transient S3 error for asset ${id}, will retry: ${error}`);
      }
      return JobStatus.Failed;
    }
  }

  /**
   * Queue all local assets for S3 upload.
   */
  @OnJob({ name: JobName.S3UploadQueueAll, queue: QueueName.S3Upload })
  async handleS3UploadQueueAll(): Promise<JobStatus> {
    const s3Manager = await this.getS3Manager();

    if (!s3Manager.isS3EnabledForLocation(StorageLocationType.Originals)) {
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
    const s3Manager = await this.getS3Manager();

    if (!s3Manager.isS3Enabled()) {
      return JobStatus.Success;
    }

    const asset = await this.assetRepository.getById(id);
    if (!asset || asset.storageBackend !== StorageBackend.S3 || !asset.s3Key) {
      this.logger.debug(`Skipping storage class migration for asset ${id}: not in S3`);
      return JobStatus.Success;
    }

    try {
      const { adapter: s3Adapter, storageClass: targetClass } = s3Manager.getConfigForLocation(
        StorageLocationType.Originals,
        asset.type,
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
    const s3Manager = await this.getS3Manager();

    if (!s3Manager.isS3Enabled()) {
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

    const s3Manager = await this.getS3Manager();

    // Check if S3 is enabled for encoded videos
    if (!s3Manager.isS3EnabledForLocation(StorageLocationType.EncodedVideos)) {
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
      const { adapter: s3Adapter, bucket, storageClass } = s3Manager.getConfigForLocation(
        StorageLocationType.EncodedVideos,
      );
      const localAdapter = this.getLocalAdapter();
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
            });
            return JobStatus.Success;
          }
        } catch {
          // S3 check failed
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

      // Update database with S3 key for encoded video
      await this.assetRepository.update({
        id: asset.id,
        s3KeyEncodedVideo: s3Key,
      });

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
      } else {
        this.logger.warn(`Transient S3 error for encoded video ${id}, will retry: ${error}`);
      }
      return JobStatus.Failed;
    }
  }

  /**
   * Queue all local encoded videos for S3 upload.
   */
  @OnJob({ name: JobName.S3UploadEncodedVideoQueueAll, queue: QueueName.S3Upload })
  async handleS3UploadEncodedVideoQueueAll(): Promise<JobStatus> {
    const s3Manager = await this.getS3Manager();

    if (!s3Manager.isS3EnabledForLocation(StorageLocationType.EncodedVideos)) {
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

    const s3Manager = await this.getS3Manager();

    // Check if S3 is enabled for thumbnails or previews
    const uploadThumbnails = s3Manager.isS3EnabledForLocation(StorageLocationType.Thumbnails);
    const uploadPreviews = s3Manager.isS3EnabledForLocation(StorageLocationType.Previews);

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
      const localAdapter = this.getLocalAdapter();
      const config = await this.getConfig({ withCache: true });

      // Process thumbnails
      if (uploadThumbnails) {
        const { adapter: s3Adapter, bucket, storageClass } = s3Manager.getConfigForLocation(
          StorageLocationType.Thumbnails,
        );

        const thumbnailFile = asset.files?.find((f: { type: string }) => f.type === 'thumbnail');
        if (thumbnailFile && thumbnailFile.storageBackend !== StorageBackend.S3) {
          const s3Key = this.generateThumbnailS3Key(asset.ownerId, asset.id, 'thumbnail.webp');

          const localFileExists = await localAdapter.exists(thumbnailFile.path);
          if (localFileExists) {
            this.logger.log(`Uploading thumbnail for asset ${id} to S3 bucket ${bucket}: ${s3Key}`);
            const { stream: readStream } = await localAdapter.readStream(thumbnailFile.path);
            await s3Adapter.writeStreamAsync(s3Key, readStream, {
              contentType: 'image/webp',
              storageClass,
            });

            // Update asset_file record
            await this.assetRepository.upsertFileWithS3({
              assetId: asset.id,
              type: AssetFileType.Thumbnail,
              path: thumbnailFile.path,
              storageBackend: StorageBackend.S3,
              s3Bucket: bucket,
              s3Key,
            });

            // Delete local file after successful upload
            if (config.storage.upload.deleteLocalAfterUpload) {
              try {
                await localAdapter.delete(thumbnailFile.path);
                this.logger.debug(`Deleted local thumbnail for asset ${id}`);
              } catch (error) {
                this.logger.warn(`Failed to delete local thumbnail: ${error}`);
              }
            }

            this.logger.log(`Successfully uploaded thumbnail for asset ${id} to S3`);
          }
        }
      }

      // Process previews
      if (uploadPreviews) {
        const { adapter: s3Adapter, bucket, storageClass } = s3Manager.getConfigForLocation(
          StorageLocationType.Previews,
        );

        const previewFile = asset.files?.find((f: { type: string }) => f.type === 'preview');
        if (previewFile && previewFile.storageBackend !== StorageBackend.S3) {
          const s3Key = this.generateThumbnailS3Key(asset.ownerId, asset.id, 'preview.webp');

          const localFileExists = await localAdapter.exists(previewFile.path);
          if (localFileExists) {
            this.logger.log(`Uploading preview for asset ${id} to S3 bucket ${bucket}: ${s3Key}`);
            const { stream: readStream } = await localAdapter.readStream(previewFile.path);
            await s3Adapter.writeStreamAsync(s3Key, readStream, {
              contentType: 'image/webp',
              storageClass,
            });

            // Update asset_file record
            await this.assetRepository.upsertFileWithS3({
              assetId: asset.id,
              type: AssetFileType.Preview,
              path: previewFile.path,
              storageBackend: StorageBackend.S3,
              s3Bucket: bucket,
              s3Key,
            });

            // Delete local file after successful upload
            if (config.storage.upload.deleteLocalAfterUpload) {
              try {
                await localAdapter.delete(previewFile.path);
                this.logger.debug(`Deleted local preview for asset ${id}`);
              } catch (error) {
                this.logger.warn(`Failed to delete local preview: ${error}`);
              }
            }

            this.logger.log(`Successfully uploaded preview for asset ${id} to S3`);
          }
        }
      }

      return JobStatus.Success;
    } catch (error) {
      const errorType = classifyS3Error(error);
      if (errorType === S3ErrorType.Permanent) {
        this.logger.error(`Permanent S3 error for thumbnails ${id}, will not retry: ${error}`);
      } else {
        this.logger.warn(`Transient S3 error for thumbnails ${id}, will retry: ${error}`);
      }
      return JobStatus.Failed;
    }
  }

  /**
   * Queue all assets with local thumbnails for S3 upload.
   */
  @OnJob({ name: JobName.S3UploadThumbnailsQueueAll, queue: QueueName.S3Upload })
  async handleS3UploadThumbnailsQueueAll(): Promise<JobStatus> {
    const s3Manager = await this.getS3Manager();

    const uploadThumbnails = s3Manager.isS3EnabledForLocation(StorageLocationType.Thumbnails);
    const uploadPreviews = s3Manager.isS3EnabledForLocation(StorageLocationType.Previews);

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
    const ext = originalPath.split('.').pop() || '';
    return `users/${userId}/${assetId}/original.${ext}`;
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
   * Get a presigned download URL for an S3 asset original.
   */
  async getPresignedDownloadUrl(assetId: string, expiresIn: number = 3600): Promise<string | null> {
    const s3Manager = await this.getS3Manager();

    if (!s3Manager.isS3Enabled()) {
      return null;
    }

    const asset = await this.assetRepository.getById(assetId);
    if (!asset || asset.storageBackend !== StorageBackend.S3 || !asset.s3Key) {
      return null;
    }

    // Use the originals adapter (where the asset is stored)
    const { adapter: s3Adapter } = s3Manager.getConfigForLocation(StorageLocationType.Originals);

    if (!s3Adapter.getPresignedDownloadUrl) {
      return null;
    }

    return s3Adapter.getPresignedDownloadUrl(asset.s3Key, { expiresIn });
  }

  /**
   * Get a presigned download URL for an encoded video in S3.
   */
  async getPresignedEncodedVideoUrl(assetId: string, expiresIn: number = 3600): Promise<string | null> {
    const s3Manager = await this.getS3Manager();

    if (!s3Manager.isS3Enabled()) {
      return null;
    }

    const asset = await this.assetRepository.getById(assetId);
    if (!asset || !asset.s3KeyEncodedVideo) {
      return null;
    }

    // Use the encoded videos adapter
    const { adapter: s3Adapter } = s3Manager.getConfigForLocation(StorageLocationType.EncodedVideos);

    if (!s3Adapter.getPresignedDownloadUrl) {
      return null;
    }

    return s3Adapter.getPresignedDownloadUrl(asset.s3KeyEncodedVideo, { expiresIn });
  }

  /**
   * Get a presigned download URL for a thumbnail or preview in S3.
   */
  async getPresignedThumbnailUrl(
    assetId: string,
    fileType: 'thumbnail' | 'preview',
    expiresIn: number = 3600,
  ): Promise<string | null> {
    const s3Manager = await this.getS3Manager();

    if (!s3Manager.isS3Enabled()) {
      return null;
    }

    const asset = await this.assetRepository.getById(assetId, { files: true });
    if (!asset || !asset.files) {
      return null;
    }

    const file = asset.files.find(
      (f: { type: string; storageBackend?: StorageBackend; s3Key?: string | null }) =>
        f.type === fileType && f.storageBackend === StorageBackend.S3 && f.s3Key,
    );

    if (!file || !file.s3Key) {
      return null;
    }

    // Use the appropriate adapter based on file type
    const locationType = fileType === 'thumbnail' ? StorageLocationType.Thumbnails : StorageLocationType.Previews;
    const { adapter: s3Adapter } = s3Manager.getConfigForLocation(locationType);

    if (!s3Adapter.getPresignedDownloadUrl) {
      return null;
    }

    return s3Adapter.getPresignedDownloadUrl(file.s3Key, { expiresIn });
  }

  /**
   * Get a presigned upload URL for direct client upload.
   */
  async getPresignedUploadUrl(
    userId: string,
    filename: string,
    contentType: string,
    expiresIn: number = 3600,
  ): Promise<{ url: string; key: string } | null> {
    const config = await this.getConfig({ withCache: true });
    const s3Manager = await this.getS3Manager();

    if (!s3Manager.isS3Enabled() || config.storage.upload.strategy !== 's3-first') {
      return null;
    }

    // Use the originals adapter for uploads
    const { adapter: s3Adapter } = s3Manager.getConfigForLocation(StorageLocationType.Originals);

    if (!s3Adapter.getPresignedUploadUrl) {
      return null;
    }

    // Generate a temporary upload key
    const uploadId = crypto.randomUUID();
    const ext = filename.split('.').pop() || '';
    const key = `uploads/${userId}/${uploadId}/original.${ext}`;

    const url = await s3Adapter.getPresignedUploadUrl(key, { expiresIn, contentType });

    return { url, key };
  }

  /**
   * Clean up orphaned local files for assets that have been uploaded to S3.
   * This handles the case where the process crashed after S3 upload but before local delete.
   */
  @OnJob({ name: JobName.S3CleanupOrphanedFiles, queue: QueueName.S3Upload })
  async handleS3CleanupOrphanedFiles(): Promise<JobStatus> {
    const config = await this.getConfig({ withCache: true });
    const s3Manager = await this.getS3Manager();

    if (!s3Manager.isS3Enabled()) {
      this.logger.log('S3 orphaned files cleanup skipped: S3 not enabled');
      return JobStatus.Success;
    }

    if (!config.storage.upload.deleteLocalAfterUpload) {
      this.logger.log('S3 orphaned files cleanup skipped: deleteLocalAfterUpload is disabled');
      return JobStatus.Success;
    }

    this.logger.log('Starting S3 orphaned files cleanup');

    const localAdapter = this.getLocalAdapter();
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
}
