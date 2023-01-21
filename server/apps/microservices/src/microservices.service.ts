import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { IJobRepository, JobName } from '@app/domain';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), ms));

@Injectable()
export class MicroservicesService implements OnModuleInit {
  constructor(@Inject(IJobRepository) private jobRepository: IJobRepository) {}

  async onModuleInit() {
    // wait for migration
    await sleep(10_000);

    await this.jobRepository.add({ name: JobName.CHECKSUM_GENERATION });
  }
}
