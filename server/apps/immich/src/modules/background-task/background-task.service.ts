import { InjectQueue } from '@nestjs/bull/dist/decorators';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { JobName, QueueName } from '@app/job';
import { AssetResponseDto } from '../../api-v1/asset/response-dto/asset-response.dto';

@Injectable()
export class BackgroundTaskService {
  constructor(
    @InjectQueue(QueueName.BACKGROUND_TASK)
    private backgroundTaskQueue: Queue,
  ) {}

  async deleteFileOnDisk(assets: AssetResponseDto[]) {
    await this.backgroundTaskQueue.add(JobName.DELETE_FILE_ON_DISK, { assets });
  }
}
