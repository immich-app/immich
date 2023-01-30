import { IAssetUploadedJob, JobName, JobService, QueueName } from '@app/domain';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor(QueueName.ASSET_UPLOADED)
export class AssetUploadedProcessor {
  constructor(private jobService: JobService) {}

  @Process(JobName.ASSET_UPLOADED)
  async processUploadedVideo(job: Job<IAssetUploadedJob>) {
    await this.jobService.handleUploadedAsset(job);
  }
}
