import { IAssetUploadedJob, IDeleteFilesJob, IUserDeletionJob, JobName, JobService, QueueName } from '@app/domain';
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
  async onDeleteFileOnDisk(job: Job<IDeleteFilesJob>) {
    await this.jobService.handle({ name: JobName.DELETE_FILES, data: job.data });
  }
}

@Processor(QueueName.CONFIG)
export class StorageMigrationProcessor {
  constructor(private jobService: JobService) {}

  @Process({ name: JobName.TEMPLATE_MIGRATION, concurrency: 100 })
  async onTemplateMigration() {
    await this.jobService.handle({ name: JobName.TEMPLATE_MIGRATION });
  }

  @Process({ name: JobName.CONFIG_CHANGE, concurrency: 1 })
  async onConfigChange() {
    await this.jobService.handle({ name: JobName.CONFIG_CHANGE });
  }
}

@Processor(QueueName.USER_DELETION)
export class UserDeletionProcessor {
  constructor(private jobService: JobService) {}
  @Process(JobName.USER_DELETION)
  async onUserDelete(job: Job<IUserDeletionJob>) {
    await this.jobService.handle({ name: JobName.USER_DELETION, data: job.data });
  }
}
