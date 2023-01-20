import { IJobRepository, JobItem, JobName, QueueName } from '@app/domain';
import { InjectQueue } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Queue } from 'bull';

export class JobRepository implements IJobRepository {
  private logger = new Logger(JobRepository.name);

  constructor(@InjectQueue(QueueName.CONFIG) private configQueue: Queue) {}

  async add(item: JobItem): Promise<void> {
    switch (item.name) {
      case JobName.CONFIG_CHANGE:
        await this.configQueue.add(JobName.CONFIG_CHANGE, {});
        break;
      default:
        // TODO inject remaining queues and map job to queue
        this.logger.error('Invalid job', item);
    }
  }
}
