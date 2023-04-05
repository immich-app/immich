import { IJobRepository, JobCounts, JobItem, JobName, QueueStatus } from '@app/domain';
import { getQueueToken } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Queue, type JobCounts as BullJobCounts } from 'bull';

@Injectable()
export class JobRepository implements IJobRepository {
  constructor(private moduleRef: ModuleRef) {}

  async getQueueStatus(jobName: JobName): Promise<QueueStatus> {
    const queue = this.getQueue(jobName);

    return {
      isActive: !!(await queue.getActiveCount()),
      isPaused: await queue.isPaused(),
    };
  }

  pause(name: JobName) {
    return this.getQueue(name).pause();
  }

  resume(name: JobName) {
    return this.getQueue(name).resume();
  }

  empty(name: JobName) {
    return this.getQueue(name).empty();
  }

  getJobCounts(name: JobName): Promise<JobCounts> {
    // Typecast needed because the `paused` key is missing from Bull's
    // type definition. Can be removed once fixed upstream.
    return this.getQueue(name).getJobCounts() as Promise<BullJobCounts & { paused: number }>;
  }

  async queue(item: JobItem): Promise<void> {
    await this.getQueue(item.name).add((item as { data: any }).data || {});
  }

  private getQueue(jobName: JobName) {
    return this.moduleRef.get<Queue>(getQueueToken(jobName), { strict: false });
  }
}
