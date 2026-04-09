import { Injectable } from '@nestjs/common';
import { OnJob } from 'src/decorators';
import { JobName, JobStatus, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';

export type StorageTier = 'hot' | 'warm' | 'cold' | 'archive';

export interface StorageTierConfig {
  enabled: boolean;
  tiers: {
    hot: { path: string; maxAgeDays: number };
    warm: { path: string; maxAgeDays: number };
    cold: { path: string; maxAgeDays: number };
    archive: { path: string };
  };
  evaluateIntervalHours: number;
}

export interface TierEvaluation {
  assetId: string;
  currentTier: StorageTier;
  suggestedTier: StorageTier;
  lastAccessed: Date;
  fileSize: number;
  reason: string;
}

@Injectable()
export class StorageTieringService extends BaseService {
  private config: StorageTierConfig = {
    enabled: false,
    tiers: {
      hot: { path: '/data/immich/hot', maxAgeDays: 30 },
      warm: { path: '/data/immich/warm', maxAgeDays: 180 },
      cold: { path: '/data/immich/cold', maxAgeDays: 365 },
      archive: { path: '/data/immich/archive' },
    },
    evaluateIntervalHours: 24,
  };

  @OnJob({ name: JobName.StorageTierEvaluate, queue: QueueName.BackgroundTask })
  async handleTierEvaluate(_job: JobOf<JobName.StorageTierEvaluate>): Promise<JobStatus> {
    if (!this.config.enabled) {
      return JobStatus.Skipped;
    }

    try {
      this.logger.log('Evaluating storage tier assignments...');

      // In full implementation:
      // 1. Query all assets with their last access time
      // 2. Compare age against tier thresholds
      // 3. Queue migration jobs for assets that need to move

      // const evaluations = await this.evaluateAllAssets();
      // for (const eval of evaluations.filter(e => e.currentTier !== e.suggestedTier)) {
      //   await this.jobRepository.queue({
      //     name: JobName.StorageTierMigrate,
      //     data: { assetId: eval.assetId, fromTier: eval.currentTier, toTier: eval.suggestedTier },
      //   });
      // }

      return JobStatus.Success;
    } catch (error: unknown) {
      this.logger.error(`Storage tier evaluation failed: ${error}`);
      return JobStatus.Failed;
    }
  }

  @OnJob({ name: JobName.StorageTierMigrate, queue: QueueName.BackgroundTask })
  async handleTierMigrate({ assetId, fromTier, toTier }: JobOf<JobName.StorageTierMigrate>): Promise<JobStatus> {
    if (!this.config.enabled) {
      return JobStatus.Skipped;
    }

    try {
      this.logger.verbose(`Migrating asset ${assetId}: ${fromTier} → ${toTier}`);

      // In full implementation:
      // 1. Copy file to new tier path
      // 2. Verify checksum
      // 3. Update asset path in database
      // 4. Remove from old tier

      return JobStatus.Success;
    } catch (error: unknown) {
      this.logger.error(`Storage tier migration failed for ${assetId}: ${error}`);
      return JobStatus.Failed;
    }
  }

  private determineTier(lastAccessedDaysAgo: number): StorageTier {
    if (lastAccessedDaysAgo <= this.config.tiers.hot.maxAgeDays) {
      return 'hot';
    }
    if (lastAccessedDaysAgo <= this.config.tiers.warm.maxAgeDays) {
      return 'warm';
    }
    if (lastAccessedDaysAgo <= this.config.tiers.cold.maxAgeDays) {
      return 'cold';
    }
    return 'archive';
  }
}
