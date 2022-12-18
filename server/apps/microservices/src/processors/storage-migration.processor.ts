import { ImmichConfigService } from '@app/immich-config';
import { QueueNameEnum, templateMigrationProcessorName, updateTemplateProcessorName } from '@app/job';
import { StorageMigration } from '@app/job/interfaces/storage-migration.interface';
import { StorageService } from '@app/storage';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor(QueueNameEnum.STORAGE_MIGRATION)
export class StorageMigrationProcessor {
  readonly logger: Logger = new Logger(StorageMigrationProcessor.name);

  constructor(private storageService: StorageService, private immichConfigService: ImmichConfigService) {}

  /**
   * Migration process when a new user set a new storage template.
   * @param job
   */
  @Process({ name: templateMigrationProcessorName, concurrency: 1 })
  async templateMigration(job: Job<StorageMigration>) {
    const { asset, filename } = job.data;
    await this.storageService.moveAsset(asset, filename);
  }

  /**
   * Update config when a new storage template is set.
   * This is to ensure the synchronization between processes.
   * @param job
   */
  @Process({ name: updateTemplateProcessorName, concurrency: 1 })
  async updateTemplate() {
    const latestConfig = await this.immichConfigService.getConfig();
    await this.immichConfigService.updateConfig(latestConfig);
  }
}
