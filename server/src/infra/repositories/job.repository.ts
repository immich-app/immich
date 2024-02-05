import {
  IJobRepository,
  JobCounts,
  JobItem,
  JobName,
  JOBS_TO_QUEUE,
  QueueCleanType,
  QueueName,
  QueueStatus,
} from '@app/domain';
import { ImmichLogger } from '@app/infra/logger';
import { getQueueToken } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Job, JobsOptions, Processor, Queue, Worker, WorkerOptions } from 'bullmq';
import { CronJob, CronTime } from 'cron';
import { setTimeout } from 'node:timers/promises';
import { bullConfig } from '../infra.config';

@Injectable()
export class JobRepository implements IJobRepository {
  private workers: Partial<Record<QueueName, Worker>> = {};
  private logger = new ImmichLogger(JobRepository.name);

  constructor(
    private moduleReference: ModuleRef,
    private schedulerReqistry: SchedulerRegistry,
  ) {}

  addHandler(queueName: QueueName, concurrency: number, handler: (item: JobItem) => Promise<void>) {
    const workerHandler: Processor = async (job: Job) => handler(job as JobItem);
    const workerOptions: WorkerOptions = { ...bullConfig, concurrency };
    this.workers[queueName] = new Worker(queueName, workerHandler, workerOptions);
  }

  addCronJob(name: string, expression: string, onTick: () => void, start = true): void {
    const job = new CronJob<null, null>(
      expression,
      onTick,
      // function to run onComplete
      undefined,
      // whether it should start directly
      start,
      // timezone
      undefined,
      // context
      undefined,
      // runOnInit
      undefined,
      // utcOffset
      undefined,
      // prevents memory leaking by automatically stopping when the node process finishes
      true,
    );

    this.schedulerReqistry.addCronJob(name, job);
  }

  updateCronJob(name: string, expression?: string, start?: boolean): void {
    const job = this.schedulerReqistry.getCronJob(name);
    if (expression) {
      job.setTime(new CronTime(expression));
    }
    if (start !== undefined) {
      start ? job.start() : job.stop();
    }
  }

  deleteCronJob(name: string): void {
    this.schedulerReqistry.deleteCronJob(name);
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

  clear(name: QueueName, type: QueueCleanType) {
    return this.getQueue(name).clean(0, 1000, type);
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

  async queueAll(items: JobItem[]): Promise<void> {
    if (items.length === 0) {
      return;
    }

    const promises = [];
    const itemsByQueue = {} as Record<string, (JobItem & { data: any; options: JobsOptions | undefined })[]>;
    for (const item of items) {
      const queueName = JOBS_TO_QUEUE[item.name];
      const job = {
        name: item.name,
        data: item.data || {},
        options: this.getJobOptions(item) || undefined,
      } as JobItem & { data: any; options: JobsOptions | undefined };

      if (job.options?.jobId) {
        // need to use add() instead of addBulk() for jobId deduplication
        promises.push(this.getQueue(queueName).add(item.name, item.data, job.options));
      } else {
        itemsByQueue[queueName] = itemsByQueue[queueName] || [];
        itemsByQueue[queueName].push(job);
      }
    }

    for (const [queueName, jobs] of Object.entries(itemsByQueue)) {
      const queue = this.getQueue(queueName as QueueName);
      promises.push(queue.addBulk(jobs));
    }

    await Promise.all(promises);
  }

  async queue(item: JobItem): Promise<void> {
    return this.queueAll([item]);
  }

  async waitForQueueCompletion(...queues: QueueName[]): Promise<void> {
    let activeQueue: QueueStatus | undefined;
    do {
      const statuses = await Promise.all(queues.map((name) => this.getQueueStatus(name)));
      activeQueue = statuses.find((status) => status.isActive);
    } while (activeQueue);
    {
      this.logger.verbose(`Waiting for ${activeQueue} queue to stop...`);
      await setTimeout(1000);
    }
  }

  private getJobOptions(item: JobItem): JobsOptions | null {
    switch (item.name) {
      case JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE: {
        return { jobId: item.data.id };
      }
      case JobName.GENERATE_PERSON_THUMBNAIL: {
        return { priority: 1 };
      }
      case JobName.QUEUE_FACIAL_RECOGNITION: {
        return { jobId: JobName.QUEUE_FACIAL_RECOGNITION };
      }

      default: {
        return null;
      }
    }
  }

  private getQueue(queue: QueueName): Queue {
    return this.moduleReference.get<Queue>(getQueueToken(queue), { strict: false });
  }
}
