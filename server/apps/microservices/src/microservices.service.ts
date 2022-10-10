import { QueueNameEnum } from '@app/job';
import { InjectQueue } from '@nestjs/bull';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bull';
import { randomUUID } from 'node:crypto';

@Injectable()
export class MicroservicesService implements OnModuleInit {
  constructor(
    @InjectQueue(QueueNameEnum.CHECKSUM_GENERATION)
    private generateChecksumQueue: Queue,
  ) {}

  async onModuleInit() {
    await this.generateChecksumQueue.add(
      {},
      {
        jobId: randomUUID(),
        delay: 10000, // wait for migration
      },
    );
  }
}
