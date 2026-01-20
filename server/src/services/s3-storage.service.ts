import { Injectable } from '@nestjs/common';
import { SystemConfig } from 'src/config';
import { OnJob } from 'src/decorators';
import { AssetType, JobName, JobStatus, QueueName, StorageBackend } from 'src/enum';
import { StorageAdapterFactory } from 'src/repositories/storage';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';
import { mimeTypes } from 'src/utils/mime-types';

/**
 * Service for handling S3 storage operations.
 * Manages uploading assets to S3 and synchronizing storage locations.
 */
@Injectable()
export class S3StorageService extends BaseService {
  private storageAdapterFactory = new StorageAdapterFactory();

  /**
   * Handle uploading a single asset's original file to S3.
   * This is called after thumbnail generation is complete.
   */
  @OnJob({ name: JobName.S3UploadAsset, queue: QueueName.S3Upload })
  async handleS3UploadAsset(job: JobOf<JobName.S3UploadAsset>): Promise<JobStatus> {
    const { id } = job;

    const config = await this.getConfig({ withCache: true });

    // Check if S3 is enabled for originals
    if (!config.storage.s3.enabled || config.storage.locations.originals !== StorageBackend.S3) {
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
      const s3Adapter = this.storageAdapterFactory.getS3Adapter(config.storage.s3);
      const localAdapter = this.storageAdapterFactory.getLocalAdapter();

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
              s3Bucket: config.storage.s3.bucket,
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

      this.logger.log(`Uploading asset ${id} to S3: ${s3Key}`);

      // Read from local storage
      const fileBuffer = await localAdapter.read(asset.originalPath);

      // Upload to S3 with appropriate storage class based on asset type
      const storageClass = this.getStorageClassForOriginal(asset.type, config);
      await s3Adapter.write(s3Key, fileBuffer, {
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
        s3Bucket: config.storage.s3.bucket,
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
      this.logger.error(`Failed to upload asset ${id} to S3: ${error}`);
      return JobStatus.Failed;
    }
  }

  /**
   * Queue all local assets for S3 upload.
   */
  @OnJob({ name: JobName.S3UploadQueueAll, queue: QueueName.S3Upload })
  async handleS3UploadQueueAll(): Promise<JobStatus> {
    const config = await this.getConfig({ withCache: true });

    if (!config.storage.s3.enabled || config.storage.locations.originals !== StorageBackend.S3) {
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
    const config = await this.getConfig({ withCache: true });

    if (!config.storage.s3.enabled) {
      return JobStatus.Success;
    }

    const asset = await this.assetRepository.getById(id);
    if (!asset || asset.storageBackend !== StorageBackend.S3 || !asset.s3Key) {
      this.logger.debug(`Skipping storage class migration for asset ${id}: not in S3`);
      return JobStatus.Success;
    }

    try {
      const targetClass = this.getStorageClassForOriginal(asset.type, config);
      const s3Adapter = this.storageAdapterFactory.getS3Adapter(config.storage.s3);

      this.logger.log(`Migrating asset ${id} to storage class ${targetClass}`);

      // Copy object in-place with new storage class
      await s3Adapter.copyWithStorageClass(asset.s3Key, targetClass);

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
    const config = await this.getConfig({ withCache: true });

    if (!config.storage.s3.enabled) {
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

    const config = await this.getConfig({ withCache: true });

    // Check if S3 is enabled for encoded videos
    if (!config.storage.s3.enabled || config.storage.locations.encodedVideos !== StorageBackend.S3) {
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
      const s3Adapter = this.storageAdapterFactory.getS3Adapter(config.storage.s3);
      const localAdapter = this.storageAdapterFactory.getLocalAdapter();

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

      this.logger.log(`Uploading encoded video for asset ${id} to S3: ${s3Key}`);

      // Read from local storage
      const fileBuffer = await localAdapter.read(asset.encodedVideoPath);

      // Upload to S3 with STANDARD_IA storage class for encoded videos
      const storageClass = config.storage.s3.storageClasses.encodedVideos;
      await s3Adapter.write(s3Key, fileBuffer, {
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
      this.logger.error(`Failed to upload encoded video ${id} to S3: ${error}`);
      return JobStatus.Failed;
    }
  }

  /**
   * Queue all local encoded videos for S3 upload.
   */
  @OnJob({ name: JobName.S3UploadEncodedVideoQueueAll, queue: QueueName.S3Upload })
  async handleS3UploadEncodedVideoQueueAll(): Promise<JobStatus> {
    const config = await this.getConfig({ withCache: true });

    if (!config.storage.s3.enabled || config.storage.locations.encodedVideos !== StorageBackend.S3) {
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

    const config = await this.getConfig({ withCache: true });

    // Check if S3 is enabled for thumbnails or previews
    const uploadThumbnails = config.storage.s3.enabled && config.storage.locations.thumbnails === StorageBackend.S3;
    const uploadPreviews = config.storage.s3.enabled && config.storage.locations.previews === StorageBackend.S3;

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
      const s3Adapter = this.storageAdapterFactory.getS3Adapter(config.storage.s3);
      const localAdapter = this.storageAdapterFactory.getLocalAdapter();
      const storageClass = config.storage.s3.storageClasses.thumbnails;

      // Process thumbnails
      if (uploadThumbnails) {
        const thumbnailFile = asset.files?.find((f: { type: string }) => f.type === 'thumbnail');
        if (thumbnailFile && thumbnailFile.storageBackend !== StorageBackend.S3) {
          const s3Key = this.generateThumbnailS3Key(asset.ownerId, asset.id, 'thumbnail.webp');

          const localFileExists = await localAdapter.exists(thumbnailFile.path);
          if (localFileExists) {
            this.logger.log(`Uploading thumbnail for asset ${id} to S3: ${s3Key}`);
            const fileBuffer = await localAdapter.read(thumbnailFile.path);
            await s3Adapter.write(s3Key, fileBuffer, {
              contentType: 'image/webp',
              storageClass,
            });

            // Update asset_file record
            await this.assetRepository.upsertFileWithS3({
              assetId: asset.id,
              type: 'thumbnail',
              path: thumbnailFile.path,
              storageBackend: StorageBackend.S3,
              s3Bucket: config.storage.s3.bucket,
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
        const previewFile = asset.files?.find((f: { type: string }) => f.type === 'preview');
        if (previewFile && previewFile.storageBackend !== StorageBackend.S3) {
          const s3Key = this.generateThumbnailS3Key(asset.ownerId, asset.id, 'preview.webp');

          const localFileExists = await localAdapter.exists(previewFile.path);
          if (localFileExists) {
            this.logger.log(`Uploading preview for asset ${id} to S3: ${s3Key}`);
            const fileBuffer = await localAdapter.read(previewFile.path);
            await s3Adapter.write(s3Key, fileBuffer, {
              contentType: 'image/webp',
              storageClass,
            });

            // Update asset_file record
            await this.assetRepository.upsertFileWithS3({
              assetId: asset.id,
              type: 'preview',
              path: previewFile.path,
              storageBackend: StorageBackend.S3,
              s3Bucket: config.storage.s3.bucket,
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
      this.logger.error(`Failed to upload thumbnails for asset ${id} to S3: ${error}`);
      return JobStatus.Failed;
    }
  }

  /**
   * Queue all assets with local thumbnails for S3 upload.
   */
  @OnJob({ name: JobName.S3UploadThumbnailsQueueAll, queue: QueueName.S3Upload })
  async handleS3UploadThumbnailsQueueAll(): Promise<JobStatus> {
    const config = await this.getConfig({ withCache: true });

    const uploadThumbnails = config.storage.s3.enabled && config.storage.locations.thumbnails === StorageBackend.S3;
    const uploadPreviews = config.storage.s3.enabled && config.storage.locations.previews === StorageBackend.S3;

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
   * Get the appropriate S3 storage class for an original asset based on its type.
   * Photos and videos have different access patterns and storage class recommendations.
   */
  private getStorageClassForOriginal(assetType: AssetType, config: SystemConfig): string {
    const classes = config.storage.s3.storageClasses;
    return assetType === AssetType.Video ? classes.originalsVideos : classes.originalsPhotos;
  }

  /**
   * Get a presigned download URL for an S3 asset original.
   */
  async getPresignedDownloadUrl(assetId: string, expiresIn: number = 3600): Promise<string | null> {
    const config = await this.getConfig({ withCache: true });

    if (!config.storage.s3.enabled) {
      return null;
    }

    const asset = await this.assetRepository.getById(assetId);
    if (!asset || asset.storageBackend !== StorageBackend.S3 || !asset.s3Key) {
      return null;
    }

    const s3Adapter = this.storageAdapterFactory.getS3Adapter(config.storage.s3);

    if (!s3Adapter.getPresignedDownloadUrl) {
      return null;
    }

    return s3Adapter.getPresignedDownloadUrl(asset.s3Key, { expiresIn });
  }

  /**
   * Get a presigned download URL for an encoded video in S3.
   */
  async getPresignedEncodedVideoUrl(assetId: string, expiresIn: number = 3600): Promise<string | null> {
    const config = await this.getConfig({ withCache: true });

    if (!config.storage.s3.enabled) {
      return null;
    }

    const asset = await this.assetRepository.getById(assetId);
    if (!asset || !asset.s3KeyEncodedVideo) {
      return null;
    }

    const s3Adapter = this.storageAdapterFactory.getS3Adapter(config.storage.s3);

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
    const config = await this.getConfig({ withCache: true });

    if (!config.storage.s3.enabled) {
      return null;
    }

    const asset = await this.assetRepository.getById(assetId, { files: true });
    if (!asset || !asset.files) {
      return null;
    }

    const file = asset.files.find((f: { type: string; storageBackend?: StorageBackend; s3Key?: string }) =>
      f.type === fileType && f.storageBackend === StorageBackend.S3 && f.s3Key
    );

    if (!file || !file.s3Key) {
      return null;
    }

    const s3Adapter = this.storageAdapterFactory.getS3Adapter(config.storage.s3);

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

    if (!config.storage.s3.enabled || config.storage.upload.strategy !== 's3-first') {
      return null;
    }

    const s3Adapter = this.storageAdapterFactory.getS3Adapter(config.storage.s3);

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
}
