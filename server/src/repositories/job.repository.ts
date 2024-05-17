import { getQueueToken } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Job, JobsOptions, Processor, Queue, Worker, WorkerOptions } from 'bullmq';
import { CronJob, CronTime } from 'cron';
import { setTimeout } from 'node:timers/promises';
import { bullConfig } from 'src/config';
import {
  IJobRepository,
  JobCounts,
  JobItem,
  JobName,
  QueueCleanType,
  QueueName,
  QueueStatus,
} from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { Instrumentation } from 'src/utils/instrumentation';

export const JOBS_TO_QUEUE: Record<JobName, QueueName> = {
  // misc
  [JobName.ASSET_DELETION]: QueueName.BACKGROUND_TASK,
  [JobName.ASSET_DELETION_CHECK]: QueueName.BACKGROUND_TASK,
  [JobName.USER_DELETE_CHECK]: QueueName.BACKGROUND_TASK,
  [JobName.USER_DELETION]: QueueName.BACKGROUND_TASK,
  [JobName.DELETE_FILES]: QueueName.BACKGROUND_TASK,
  [JobName.CLEAN_OLD_AUDIT_LOGS]: QueueName.BACKGROUND_TASK,
  [JobName.CLEAN_OLD_SESSION_TOKENS]: QueueName.BACKGROUND_TASK,
  [JobName.PERSON_CLEANUP]: QueueName.BACKGROUND_TASK,
  [JobName.USER_SYNC_USAGE]: QueueName.BACKGROUND_TASK,

  // conversion
  [JobName.QUEUE_VIDEO_CONVERSION]: QueueName.VIDEO_CONVERSION,
  [JobName.VIDEO_CONVERSION]: QueueName.VIDEO_CONVERSION,

  // thumbnails
  [JobName.QUEUE_GENERATE_THUMBNAILS]: QueueName.THUMBNAIL_GENERATION,
  [JobName.GENERATE_PREVIEW]: QueueName.THUMBNAIL_GENERATION,
  [JobName.GENERATE_THUMBNAIL]: QueueName.THUMBNAIL_GENERATION,
  [JobName.GENERATE_THUMBHASH]: QueueName.THUMBNAIL_GENERATION,
  [JobName.GENERATE_PERSON_THUMBNAIL]: QueueName.THUMBNAIL_GENERATION,

  // metadata
  [JobName.QUEUE_METADATA_EXTRACTION]: QueueName.METADATA_EXTRACTION,
  [JobName.METADATA_EXTRACTION]: QueueName.METADATA_EXTRACTION,
  [JobName.LINK_LIVE_PHOTOS]: QueueName.METADATA_EXTRACTION,

  // storage template
  [JobName.STORAGE_TEMPLATE_MIGRATION]: QueueName.STORAGE_TEMPLATE_MIGRATION,
  [JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE]: QueueName.STORAGE_TEMPLATE_MIGRATION,

  // migration
  [JobName.QUEUE_MIGRATION]: QueueName.MIGRATION,
  [JobName.MIGRATE_ASSET]: QueueName.MIGRATION,
  [JobName.MIGRATE_PERSON]: QueueName.MIGRATION,

  // facial recognition
  [JobName.QUEUE_FACE_DETECTION]: QueueName.FACE_DETECTION,
  [JobName.FACE_DETECTION]: QueueName.FACE_DETECTION,
  [JobName.QUEUE_FACIAL_RECOGNITION]: QueueName.FACIAL_RECOGNITION,
  [JobName.FACIAL_RECOGNITION]: QueueName.FACIAL_RECOGNITION,

  // smart search
  [JobName.QUEUE_SMART_SEARCH]: QueueName.SMART_SEARCH,
  [JobName.SMART_SEARCH]: QueueName.SMART_SEARCH,

  // duplicate detection
  [JobName.QUEUE_DUPLICATE_DETECTION]: QueueName.DUPLICATE_DETECTION,
  [JobName.DUPLICATE_DETECTION]: QueueName.DUPLICATE_DETECTION,

  // XMP sidecars
  [JobName.QUEUE_SIDECAR]: QueueName.SIDECAR,
  [JobName.SIDECAR_DISCOVERY]: QueueName.SIDECAR,
  [JobName.SIDECAR_SYNC]: QueueName.SIDECAR,
  [JobName.SIDECAR_WRITE]: QueueName.SIDECAR,

  // Library management
  [JobName.LIBRARY_SCAN_ASSET]: QueueName.LIBRARY,
  [JobName.LIBRARY_SCAN]: QueueName.LIBRARY,
  [JobName.LIBRARY_DELETE]: QueueName.LIBRARY,
  [JobName.LIBRARY_REMOVE_OFFLINE]: QueueName.LIBRARY,
  [JobName.LIBRARY_QUEUE_SCAN_ALL]: QueueName.LIBRARY,
  [JobName.LIBRARY_QUEUE_CLEANUP]: QueueName.LIBRARY,

  // Notification
  [JobName.SEND_EMAIL]: QueueName.NOTIFICATION,
  [JobName.NOTIFY_SIGNUP]: QueueName.NOTIFICATION,

  // Version check
  [JobName.VERSION_CHECK]: QueueName.BACKGROUND_TASK,
};

@Instrumentation()
@Injectable()
export class JobRepository implements IJobRepository {
  private workers: Partial<Record<QueueName, Worker>> = {};

  constructor(
    private moduleReference: ModuleRef,
    private schedulerReqistry: SchedulerRegistry,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(JobRepository.name);
  }

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
