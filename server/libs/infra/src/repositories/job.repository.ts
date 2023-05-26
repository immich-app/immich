import { IJobRepository, JobCounts, JobItem, JobName, JOBS_TO_QUEUE, QueueName, QueueStatus } from '@app/domain';
import { getQueueToken } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { JobOptions, Queue, type JobCounts as BullJobCounts } from 'bull';

@Injectable()
export class JobRepository implements IJobRepository {
  constructor(private moduleRef: ModuleRef) {}

  async getQueueStatus(name: QueueName): Promise<QueueStatus> {
    const queue = this.getQueue(name);

    return {
      isActive: !!(await queue.getActiveCount()),
      isPaused: await queue.isPaused(),
    };
  }

  pause(name: QueueName) {
    return this.getQueue(name).pause();
  }

  resume(name: QueueName) {
    return this.getQueue(name).resume();
  }

  empty(name: QueueName) {
    return this.getQueue(name).empty();
  }

  getJobCounts(name: QueueName): Promise<JobCounts> {
    // Typecast needed because the `paused` key is missing from Bull's
    // type definition. Can be removed once fixed upstream.
    return this.getQueue(name).getJobCounts() as Promise<BullJobCounts & { paused: number }>;
  }

  async queue(item: JobItem): Promise<void> {
    const jobName = item.name;
    const jobData = (item as { data?: any })?.data || {};
    const jobOptions = this.getJobOptions(item) || undefined;

    await this.getQueue(JOBS_TO_QUEUE[jobName]).add(jobName, jobData, jobOptions);
  }

  private getJobOptions(item: JobItem): JobOptions | null {
    switch (item.name) {
      case JobName.ASSET_UPLOADED:
        return { jobId: item.data.asset.id };

      case JobName.GENERATE_FACE_THUMBNAIL:
        return { priority: 1 };

      default:
        return null;
    }
  }

  private getQueue(queue: QueueName) {
    return this.moduleRef.get<Queue>(getQueueToken(queue), { strict: false });
  }
}
