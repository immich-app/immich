import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { AssetEntity } from '../../api-v1/asset/entities/asset.entity';
import { AuthUserDto } from '../../decorators/auth-user.decorator';

@Injectable()
export class ImageOptimizeService {
  constructor(
    @InjectQueue('image') private imageQueue: Queue,
    @InjectQueue('machine-learning') private machineLearningQueue: Queue,
  ) {}

  public async resizeImage(savedAsset: AssetEntity) {
    const job = await this.imageQueue.add(
      'optimize',
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
