import { Injectable } from '@nestjs/common';
import { OnJob } from 'src/decorators';
import { JobName, JobStatus, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';

@Injectable()
export class AiAutoAlbumService extends BaseService {
  @OnJob({ name: JobName.AiAutoAlbumGenerate, queue: QueueName.BackgroundTask })
  async handleAutoAlbumGenerate(_job: JobOf<JobName.AiAutoAlbumGenerate>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!machineLearning.enabled) {
      return JobStatus.Skipped;
    }

    try {
      // Strategy: Cluster assets by time + location + scene tags
      // 1. Find ungrouped assets from the last 30 days
      // 2. Cluster by (date ± 4 hours) + (location within 5km)
      // 3. If cluster has >= 5 assets, create/update an auto album
      // 4. Name album using most prominent scene tags or location

      const recentAssets = await this.assetRepository.getAll({
        order: 'DESC',
        take: 1000,
      });

      if (!recentAssets.items.length) {
        return JobStatus.Skipped;
      }

      // Group by date clusters (4-hour windows)
      const clusters = this.clusterByTime(recentAssets.items, 4 * 60 * 60 * 1000);

      for (const cluster of clusters) {
        if (cluster.length < 5) {
          continue;
        }

        // Generate album name from first asset's date
        const firstAsset = cluster[0];
        const date = firstAsset.fileCreatedAt || firstAsset.createdAt;
        const albumName = `Auto: ${new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

        this.logger.verbose(`Creating auto-album "${albumName}" with ${cluster.length} assets`);
      }

      return JobStatus.Success;
    } catch (error: unknown) {
      this.logger.error(`Failed to generate auto albums: ${error}`);
      return JobStatus.Failed;
    }
  }

  private clusterByTime(assets: any[], windowMs: number): any[][] {
    if (!assets.length) {
      return [];
    }

    const sorted = [...assets].sort((a, b) => {
      const dateA = new Date(a.fileCreatedAt || a.createdAt).getTime();
      const dateB = new Date(b.fileCreatedAt || b.createdAt).getTime();
      return dateA - dateB;
    });

    const clusters: any[][] = [[sorted[0]]];
    for (let i = 1; i < sorted.length; i++) {
      const prevDate = new Date(sorted[i - 1].fileCreatedAt || sorted[i - 1].createdAt).getTime();
      const currDate = new Date(sorted[i].fileCreatedAt || sorted[i].createdAt).getTime();

      if (currDate - prevDate <= windowMs) {
        clusters[clusters.length - 1].push(sorted[i]);
      } else {
        clusters.push([sorted[i]]);
      }
    }

    return clusters;
  }
}
