import { BullModuleOptions } from '@nestjs/bull';
import { QueueName } from './queue-name.constant';

/**
 * Shared queues between apps and microservices
 */
export const immichSharedQueues: BullModuleOptions[] = [
  { name: QueueName.USER_DELETION },
  { name: QueueName.THUMBNAIL_GENERATION },
  { name: QueueName.ASSET_UPLOADED },
  { name: QueueName.METADATA_EXTRACTION },
  { name: QueueName.VIDEO_CONVERSION },
  { name: QueueName.CHECKSUM_GENERATION },
  { name: QueueName.MACHINE_LEARNING },
  { name: QueueName.CONFIG },
];
