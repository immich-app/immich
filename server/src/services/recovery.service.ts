import { Injectable } from '@nestjs/common';
import { OnEvent } from 'src/decorators';
import { ImmichWorker, JobName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobItem } from 'src/types';

/**
 * RecoveryService - Boot-time Recovery for Orphaned Assets
 *
 * This service runs on microservices bootstrap to detect and recover
 * assets that were uploaded to S3 but not fully processed (e.g., due
 * to a machine crash or deployment during upload).
 *
 * Recovery Flow:
 * 1. On bootstrap, query for "orphaned" S3 assets:
 *    - storageBackend = S3 (uploaded successfully)
 *    - s3Key IS NOT NULL
 *    - Missing metadata extraction OR missing thumbnails
 * 2. For each orphan, queue MetadataExtraction job
 *    - Job will download from S3 and process normally
 *    - No localPath provided (recovery mode)
 * 3. User never knows anything went wrong
 */
@Injectable()
export class RecoveryService extends BaseService {
  @OnEvent({ name: 'AppBootstrap', workers: [ImmichWorker.Microservices] })
  onBootstrap() {
    // Delay recovery check to allow other services to initialize
    // This runs after the main bootstrap sequence
    setTimeout(() => void this.recoverOrphanedAssets(), 5000);
  }

  /**
   * Find and recover assets that were uploaded to S3 but not fully processed.
   * This handles the case where a machine crashed or was restarted mid-processing.
   */
  async recoverOrphanedAssets(): Promise<void> {
    try {
      // Check if S3 is enabled
      const s3Enabled = await this.s3Manager.isS3Enabled();
      if (!s3Enabled) {
        this.logger.debug('S3 not enabled, skipping orphaned asset recovery');
        return;
      }

      this.logger.log('Checking for orphaned S3 assets to recover...');

      const orphans = await this.assetJobRepository.getOrphanedS3Assets();

      if (orphans.length === 0) {
        this.logger.log('No orphaned S3 assets found');
        return;
      }

      this.logger.log(`Found ${orphans.length} orphaned S3 assets, queueing recovery`);

      let metadataCount = 0;
      let thumbnailCount = 0;

      for (const asset of orphans) {
        // Determine which job to queue based on what's missing
        // This avoids re-running completed steps
        let job: JobItem;

        if (!asset.metadataExtractedAt) {
          // Metadata missing - start from beginning
          metadataCount++;
          job = {
            name: JobName.AssetExtractMetadata,
            data: { id: asset.id, source: 'recovery' },
          };
        } else if (!asset.previewAt || !asset.thumbnailAt) {
          // Metadata done, thumbnails missing
          thumbnailCount++;
          job = {
            name: JobName.AssetGenerateThumbnails,
            data: { id: asset.id, source: 'recovery' },
          };
        } else {
          // Shouldn't reach here due to query filter, but handle gracefully
          this.logger.debug(`Skipping asset ${asset.id} - no recovery needed`);
          continue;
        }

        this.logger.debug(`Queueing ${job.name} for orphaned asset ${asset.id}`);
        await this.jobRepository.queue(job);
      }

      this.logger.log(
        `Successfully queued ${orphans.length} orphaned assets for recovery (${metadataCount} metadata, ${thumbnailCount} thumbnails)`,
      );
    } catch (error) {
      this.logger.error(`Failed to recover orphaned assets`, error);
      // Don't throw - recovery failure shouldn't prevent server startup
    }
  }
}
