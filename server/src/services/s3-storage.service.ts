import { Injectable } from '@nestjs/common';
import { OnJob } from 'src/decorators';
import { JobName, JobStatus, QueueName, StorageBackend, StorageLocationType } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';
import { StorageAdapterFactory } from 'src/repositories/storage';
import { StorageCore } from 'src/cores/storage.core';
import { getConfig } from 'src/utils/config';

/**
 * Service for handling S3 storage operations.
 * Manages uploading assets to S3 and synchronizing storage locations.
 */
@Injectable()
export class S3StorageService extends BaseService {
  private storageAdapterFactory: StorageAdapterFactory;

  constructor() {
    super();
    this.storageAdapterFactory = new StorageAdapterFactory();
  }

  /**
   * Handle uploading a single asset's original file to S3.
   * This is called after thumbnail generation is complete.
   */
  @OnJob({ name: JobName.S3UploadAsset, queue: QueueName.S3Upload })
  async handleS3UploadAsset(job: JobOf<JobName.S3UploadAsset>): Promise<JobStatus> {
    const { id } = job;

    const config = await getConfig({
      configRepo: this.configRepository,
      metadataRepo: this.systemMetadataRepository,
      logger: this.logger,
    });

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

      this.logger.log(`Uploading asset ${id} to S3: ${s3Key}`);

      // Read from local storage
      const fileBuffer = await localAdapter.read(asset.originalPath);

      // Upload to S3
      await s3Adapter.write(s3Key, fileBuffer, {
        contentType: this.getMimeType(asset.originalPath),
      });

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
        s3Key: s3Key,
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
    const config = await getConfig({
      configRepo: this.configRepository,
      metadataRepo: this.systemMetadataRepository,
      logger: this.logger,
    });

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
   * Generate S3 key for an asset.
   * Format: users/{userId}/{assetId}/original.{ext}
   */
  private generateS3Key(userId: string, assetId: string, originalPath: string): string {
    const ext = originalPath.split('.').pop() || '';
    return `users/${userId}/${assetId}/original.${ext}`;
  }

  /**
   * Get MIME type from file path.
   */
  private getMimeType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      heic: 'image/heic',
      heif: 'image/heif',
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      mkv: 'video/x-matroska',
      webm: 'video/webm',
      raw: 'image/x-raw',
      dng: 'image/x-adobe-dng',
      cr2: 'image/x-canon-cr2',
      nef: 'image/x-nikon-nef',
      arw: 'image/x-sony-arw',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Get a presigned download URL for an S3 asset.
   */
  async getPresignedDownloadUrl(assetId: string, expiresIn: number = 3600): Promise<string | null> {
    const config = await getConfig({
      configRepo: this.configRepository,
      metadataRepo: this.systemMetadataRepository,
      logger: this.logger,
    });

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
   * Get a presigned upload URL for direct client upload.
   */
  async getPresignedUploadUrl(
    userId: string,
    filename: string,
    contentType: string,
    expiresIn: number = 3600,
  ): Promise<{ url: string; key: string } | null> {
    const config = await getConfig({
      configRepo: this.configRepository,
      metadataRepo: this.systemMetadataRepository,
      logger: this.logger,
    });

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
