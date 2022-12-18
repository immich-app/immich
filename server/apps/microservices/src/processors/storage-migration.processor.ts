import { QueueNameEnum, templateMigrationProcessorName } from '@app/job';
import { StorageMigration } from '@app/job/interfaces/storage-migration.interface';
import { StorageService } from '@app/storage';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor(QueueNameEnum.STORAGE_MIGRATION)
export class StorageMigrationProcessor {
  readonly logger: Logger = new Logger(StorageMigrationProcessor.name);

  constructor(private storageService: StorageService) {}

  /**
   * Migration process when a new user set a new storage template.
   * @param job
   */
  @Process({ name: templateMigrationProcessorName, concurrency: 5 })
  async templateMigration(job: Job<StorageMigration>) {
    const { asset, filename } = job.data;
    console.log('run job', job.id, await job.isWaiting());
    await this.storageService.moveAsset(asset, filename);
  }
}
