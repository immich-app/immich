import { Injectable } from '@nestjs/common';
import { OnJob } from 'src/decorators';
import { JobName, JobStatus, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';

export interface BatchMetadataUpdate {
  assetIds: string[];
  updates: {
    description?: string;
    dateTimeOriginal?: string;
    latitude?: number;
    longitude?: number;
    rating?: number;
    tags?: string[];
  };
}

@Injectable()
export class BatchMetadataService extends BaseService {
  @OnJob({ name: JobName.BatchMetadataUpdate, queue: QueueName.BackgroundTask })
  async handleBatchUpdate({ assetIds, updates }: JobOf<JobName.BatchMetadataUpdate>): Promise<JobStatus> {
    try {
      this.logger.log(`Batch metadata update for ${assetIds.length} assets`);

      let successCount = 0;
      let failCount = 0;

      for (const assetId of assetIds) {
        try {
          const updatePayload: Record<string, unknown> = {};

          if (updates.description !== undefined) {
            updatePayload.exifInfo = { description: updates.description };
          }

          if (updates.dateTimeOriginal) {
            updatePayload.fileCreatedAt = new Date(updates.dateTimeOriginal);
          }

          if (updates.latitude !== undefined && updates.longitude !== undefined) {
            updatePayload.exifInfo = {
              ...(updatePayload.exifInfo as Record<string, unknown> || {}),
              latitude: updates.latitude,
              longitude: updates.longitude,
            };
          }

          await this.assetRepository.update({ id: assetId, ...updatePayload } as any);

          // Handle tags
          if (updates.tags?.length) {
            for (const tagValue of updates.tags) {
              await this.tagRepository.upsertValue({ value: tagValue, parent: null, color: null });
            }
          }

          successCount++;
        } catch (error: unknown) {
          failCount++;
          this.logger.warn(`Failed to update asset ${assetId}: ${error}`);
        }
      }

      this.logger.log(`Batch update complete: ${successCount} success, ${failCount} failed`);
      return failCount === assetIds.length ? JobStatus.Failed : JobStatus.Success;
    } catch (error: unknown) {
      this.logger.error(`Batch metadata update failed: ${error}`);
      return JobStatus.Failed;
    }
  }
}
