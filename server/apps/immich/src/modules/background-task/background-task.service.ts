import { InjectQueue } from '@nestjs/bull/dist/decorators';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { randomUUID } from 'node:crypto';
import { AssetResponseDto } from '../../api-v1/asset/response-dto/asset-response.dto';

@Injectable()
export class BackgroundTaskService {
  constructor(
    @InjectQueue('background-task')
    private backgroundTaskQueue: Queue,
  ) {}

  async deleteFileOnDisk(assets: AssetResponseDto[]) {
    await this.backgroundTaskQueue.add(
      'delete-file-on-disk',
      {
        assets,
      },
      { jobId: randomUUID() },
    );
  }
}
