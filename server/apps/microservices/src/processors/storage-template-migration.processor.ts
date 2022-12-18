import { QueueNameEnum } from '@app/job';
import { Processor } from '@nestjs/bull';

@Processor(QueueNameEnum.STORAGE_TEMPLATE_MIGRATION)
export class StorageTemplateMigrationProcessor {}
