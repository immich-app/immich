import { assetUtils } from '@app/common/utils';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { JobName, QueueName } from '@app/job';
import { AssetResponseDto } from '../../api-v1/asset/response-dto/asset-response.dto';

@Processor(QueueName.BACKGROUND_TASK)
export class BackgroundTaskProcessor {
  @Process(JobName.DELETE_FILE_ON_DISK)
  async deleteFileOnDisk(job: Job<{ assets: AssetResponseDto[] }>) {
    const { assets } = job.data;

    for (const asset of assets) {
      assetUtils.deleteFiles(asset);
    }
  }
}
