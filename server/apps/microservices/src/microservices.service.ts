import { QueueName } from '@app/domain';
import { InjectQueue } from '@nestjs/bull';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bull';

@Injectable()
export class MicroservicesService implements OnModuleInit {
  constructor(
    @InjectQueue(QueueName.CHECKSUM_GENERATION)
    private generateChecksumQueue: Queue,
  ) {}

  async onModuleInit() {
    // wait for migration
    await this.generateChecksumQueue.add({}, { delay: 10000 });
  }
}
