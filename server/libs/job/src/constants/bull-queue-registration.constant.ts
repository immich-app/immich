import { BullModuleOptions } from '@nestjs/bull';
import { QueueNameEnum } from './queue-name.constant';

/**
 * Shared queues between apps and microservices
 */
export const immichSharedQueues: BullModuleOptions[] = [
  {
    name: QueueNameEnum.USER_DELETION,
  },
  {
    name: QueueNameEnum.THUMBNAIL_GENERATION,
  },
  {
    name: QueueNameEnum.ASSET_UPLOADED,
  },
  {
    name: QueueNameEnum.METADATA_EXTRACTION,
  },
  {
    name: QueueNameEnum.VIDEO_CONVERSION,
  },
  {
    name: QueueNameEnum.CHECKSUM_GENERATION,
  },
  {
    name: QueueNameEnum.MACHINE_LEARNING,
  },
  {
    name: QueueNameEnum.STORAGE_MIGRATION,
  },
];
