import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { AssetEntity } from '../../api-v1/asset/entities/asset.entity';
import { AuthUserDto } from '../../decorators/auth-user.decorator';

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

  public async resizeVideo(savedAsset: AssetEntity) {
    const job = await this.optimizeQueue.add(
      'resize-video',
      {
        savedAsset,
      },
      { jobId: randomUUID() },
    );

    return {
      jobId: job.id,
    };
  }
}
