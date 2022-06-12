import { InjectQueue } from '@nestjs/bull/dist/decorators';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { randomUUID } from 'node:crypto';
import { AssetEntity } from '@app/database/entities/asset.entity';

@Injectable()
export class BackgroundTaskService {
  constructor(
    @InjectQueue('background-task')
    private backgroundTaskQueue: Queue,
  ) {}

  async deleteFileOnDisk(assets: AssetEntity[]) {
    await this.backgroundTaskQueue.add(
      'delete-file-on-disk',
      {
        assets,
      },
      { jobId: randomUUID() },
    );
  }
}
