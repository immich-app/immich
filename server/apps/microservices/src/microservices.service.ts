import { generateChecksumQueueName } from '@app/job';
import { InjectQueue } from '@nestjs/bull';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bull';
import { randomUUID } from 'node:crypto';

@Injectable()
export class MicroservicesService implements OnModuleInit {
  constructor (
    @InjectQueue(generateChecksumQueueName)
    private generateChecksumQueue: Queue,
  ) {}

  async onModuleInit() {
    await this.generateChecksumQueue.add({}, { jobId: randomUUID() },);
  }
}
