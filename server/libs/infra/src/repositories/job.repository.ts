import { IJobRepository, JobCounts, JobItem, JobName, JOBS_TO_QUEUE, QueueName, QueueStatus } from '@app/domain';
import { getQueueToken } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Job, JobsOptions, Processor, Queue, Worker, WorkerOptions } from 'bullmq';
import { bullConfig } from '../infra.config';

@Injectable()
export class JobRepository implements IJobRepository {
  private workers: Partial<Record<QueueName, Worker>> = {};
  private logger = new Logger(JobRepository.name);

  constructor(private moduleRef: ModuleRef) {}

  addHandler(queueName: QueueName, concurrency: number, handler: (item: JobItem) => Promise<void>) {
    const workerHandler: Processor = async (job: Job) => handler(job as JobItem);
    const workerOptions: WorkerOptions = { ...bullConfig, concurrency };
    this.workers[queueName] = new Worker(queueName, workerHandler, workerOptions);
  }

  setConcurrency(queueName: QueueName, concurrency: number) {
    const worker = this.workers[queueName];
    if (!worker) {
      this.logger.warn(`Unable to set queue concurrency, worker not found: '${queueName}'`);
      return;
    }

    worker.concurrency = concurrency;
  }

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
    return this.getQueue(name).drain();
  }

  getJobCounts(name: QueueName): Promise<JobCounts> {
    return this.getQueue(name).getJobCounts(
      'active',
      'completed',
      'failed',
      'delayed',
      'waiting',
      'paused',
    ) as unknown as Promise<JobCounts>;
  }

  async queue(item: JobItem): Promise<void> {
    const jobName = item.name;
    const jobData = (item as { data?: any })?.data || {};
    const jobOptions = this.getJobOptions(item) || undefined;

    await this.getQueue(JOBS_TO_QUEUE[jobName]).add(jobName, jobData, jobOptions);
  }

  private getJobOptions(item: JobItem): JobsOptions | null {
    switch (item.name) {
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
