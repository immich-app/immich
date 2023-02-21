import { assetUtils } from '@app/common/utils';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { JobName, QueueName } from '@app/domain';
import { AssetEntity } from '@app/infra/db/entities';

@Processor(QueueName.BACKGROUND_TASK)
export class BackgroundTaskProcessor {
  @Process(JobName.DELETE_FILE_ON_DISK)
  async deleteFileOnDisk(job: Job<{ assets: AssetEntity[] }>) {
    const { assets } = job.data;

    for (const asset of assets) {
      assetUtils.deleteFiles(asset);
    }
  }
}
