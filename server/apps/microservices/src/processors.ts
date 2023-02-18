import { IAssetUploadedJob, IUserDeletionJob, JobName, JobService, QueueName } from '@app/domain';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor(QueueName.ASSET_UPLOADED)
export class AssetUploadedProcessor {
  constructor(private jobService: JobService) {}
  @Process(JobName.ASSET_UPLOADED)
  async onAssetUpload(job: Job<IAssetUploadedJob>) {
    await this.jobService.handle({ name: JobName.ASSET_UPLOADED, data: job.data });
  }
}

@Processor(QueueName.BACKGROUND_TASK)
export class BackgroundTaskProcessor {
  constructor(private jobService: JobService) {}
  @Process(JobName.DELETE_FILES)
  async onDeleteFileOnDisk(job: Job<{ files: string[] }>) {
    await this.jobService.handle({ name: JobName.DELETE_FILES, data: job.data });
  }
}

@Processor(QueueName.USER_DELETION)
export class UserDeletionProcessor {
  constructor(private jobService: JobService) {}
  @Process(JobName.USER_DELETION)
  async onUserDelete(job: Job<IUserDeletionJob>) {
    this.jobService.handle({ name: JobName.USER_DELETION, data: job.data });
  }
}
