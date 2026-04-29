import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/services/base.service';

export interface DownloadOverview {
  total: number;
  top: { assetId: string; count: number }[];
  series: { bucket: Date; count: number }[];
}

@Injectable()
export class DownloadStatsService extends BaseService {
  /**
   * Logs a download. Designed to be fire-and-forget — never throws.
   */
  logDownload(assetId: string, userId?: string | null, ipAddress?: string | null) {
    this.downloadStatsRepository.log({ assetId, userId, ipAddress }).catch((error) => {
      this.logger.warn(`Failed to log download for asset ${assetId}: ${error}`);
    });
  }

  async getOverview(userId: string): Promise<DownloadOverview> {
    const [total, top, series] = await Promise.all([
      this.downloadStatsRepository.getTotalForUser(userId),
      this.downloadStatsRepository.getTopForUser(userId, 10, 30),
      this.downloadStatsRepository.getTimeSeriesForUser(userId, 30, 'day'),
    ]);
    return { total, top, series };
  }

  getCountForAsset(assetId: string): Promise<number> {
    return this.downloadStatsRepository.getCountForAsset(assetId);
  }

  getTop(userId: string, limit: number, sinceDays: number) {
    return this.downloadStatsRepository.getTopForUser(userId, limit, sinceDays);
  }

  getTimeSeries(userId: string, sinceDays: number, granularity: 'day' | 'week' | 'month') {
    return this.downloadStatsRepository.getTimeSeriesForUser(userId, sinceDays, granularity);
  }
}
