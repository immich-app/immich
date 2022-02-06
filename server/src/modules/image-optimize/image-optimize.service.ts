import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { randomUUID } from 'crypto';
import { AssetEntity } from '../../api-v1/asset/entities/asset.entity';

@Injectable()
export class AssetOptimizeService {
  constructor(@InjectQueue('optimize') private optimizeQueue: Queue) {}

  public async resizeImage(savedAsset: AssetEntity) {
    const job = await this.optimizeQueue.add(
      'resize-image',
      {
        savedAsset,
      },
      { jobId: randomUUID() },
    );

    return {
      jobId: job.id,
    };
  }

  public async getVideoThumbnail(savedAsset: AssetEntity, filename: String) {
    const job = await this.optimizeQueue.add(
      'get-video-thumbnail',
      {
        savedAsset,
        filename,
      },
      { jobId: randomUUID() },
    );

    return {
      jobId: job.id,
    };
  }
}
