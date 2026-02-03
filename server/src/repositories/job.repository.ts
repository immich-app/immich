import { getQueueToken } from '@nestjs/bullmq';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { JobsOptions, Queue, Worker } from 'bullmq';
import { ClassConstructor } from 'class-transformer';
import { setTimeout } from 'node:timers/promises';
import { JobConfig } from 'src/decorators';
import { QueueJobResponseDto, QueueJobSearchDto } from 'src/dtos/queue.dto';
import { JobName, JobStatus, MetadataKey, QueueCleanType, QueueJobStatus, QueueName } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { JobCounts, JobItem, JobOf } from 'src/types';
import { getKeyByValue, getMethodNames, ImmichStartupError } from 'src/utils/misc';
import { getActualQueueName, getMachineIdFromJob, isAffinityQueue } from 'src/utils/queue.util';

type JobMapItem = {
  jobName: JobName;
  queueName: QueueName;
  handler: (job: JobOf<any>) => Promise<JobStatus>;
  label: string;
};

@Injectable()
export class JobRepository implements OnModuleDestroy {
  private workers: Record<string, Worker> = {};
  private handlers: Partial<Record<JobName, JobMapItem>> = {};
  private isShuttingDown = false;
  private dynamicQueueCache: Record<string, Queue> = {};

  constructor(
    private moduleRef: ModuleRef,
    private configRepository: ConfigRepository,
    private eventRepository: EventRepository,
    private logger: LoggingRepository,
  ) {
    this.logger.setContext(JobRepository.name);
  }

  /**
   * Gracefully shutdown all BullMQ workers on SIGTERM.
   * This stops workers from picking up new jobs and waits for current jobs to complete.
   */
  async onModuleDestroy(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }
    this.isShuttingDown = true;

    this.logger.log('Gracefully shutting down job workers...');

    const closePromises = Object.entries(this.workers).map(async ([queueName, worker]) => {
      if (worker) {
        this.logger.log(`Closing worker for queue: ${queueName}`);
        try {
          // close(true) = force close without waiting, close() = wait for current job
          await worker.close();
          this.logger.log(`Worker for queue ${queueName} closed successfully`);
        } catch (error) {
          this.logger.error(`Error closing worker for queue ${queueName}: ${error}`);
        }
      }
    });

    await Promise.all(closePromises);

    // Close dynamically created queues to release Redis connections
    const queueClosePromises = Object.entries(this.dynamicQueueCache).map(async ([queueName, queue]) => {
      try {
        await queue.close();
      } catch (error) {
        this.logger.error(`Error closing dynamic queue ${queueName}: ${error}`);
      }
    });
    await Promise.all(queueClosePromises);

    this.logger.log('All job workers shut down');
  }

  setup(services: ClassConstructor<unknown>[]) {
    const reflector = this.moduleRef.get(Reflector, { strict: false });

    // discovery
    for (const Service of services) {
      const instance = this.moduleRef.get<any>(Service);
      for (const methodName of getMethodNames(instance)) {
        const handler = instance[methodName];
        const config = reflector.get<JobConfig>(MetadataKey.JobConfig, handler);
        if (!config) {
          continue;
        }

        const { name: jobName, queue: queueName } = config;
        const label = `${Service.name}.${handler.name}`;

        // one handler per job
        if (this.handlers[jobName]) {
          const jobKey = getKeyByValue(JobName, jobName);
          const errorMessage = `Failed to add job handler for ${label}`;
          this.logger.error(
            `${errorMessage}. JobName.${jobKey} is already handled by ${this.handlers[jobName].label}.`,
          );
          throw new ImmichStartupError(errorMessage);
        }

        this.handlers[jobName] = {
          label,
          jobName,
          queueName,
          handler: handler.bind(instance),
        };

        this.logger.verbose(`Added job handler: ${jobName} => ${label}`);
      }
    }

    // no missing handlers
    for (const [jobKey, jobName] of Object.entries(JobName)) {
      const item = this.handlers[jobName];
      if (!item) {
        const errorMessage = `Failed to find job handler for Job.${jobKey} ("${jobName}")`;
        this.logger.error(
          `${errorMessage}. Make sure to add the @OnJob({ name: JobName.${jobKey}, queue: QueueName.XYZ }) decorator for the new job.`,
        );
        throw new ImmichStartupError(errorMessage);
      }
    }
  }

  startWorkers() {
    const { bull, queues, machineId } = this.configRepository.getEnv();
    for (const baseQueueName of queues) {
      // For affinity queues, use machine-prefixed queue name
      const actualQueueName = getActualQueueName(baseQueueName, machineId);
      this.logger.log(`Starting worker for queue: ${actualQueueName} (base: ${baseQueueName})`);
      const workerOptions = this.getWorkerOptions(baseQueueName);
      this.workers[actualQueueName] = new Worker(
        actualQueueName,
        (job) => this.eventRepository.emit('JobRun', baseQueueName, job as JobItem),
        { ...bull.config, concurrency: 1, ...workerOptions },
      );
    }
  }

  private getWorkerOptions(queueName: QueueName): { lockDuration?: number; stalledInterval?: number } {
    // Queues that involve S3 operations or long-running tasks need longer lock durations
    // to prevent lock expiration when running multiple distributed workers.
    // Default BullMQ lockDuration is 30s which is too short for S3 uploads with network latency.
    switch (queueName) {
      case QueueName.S3Upload: {
        return {
          lockDuration: 180_000, // 3 minutes - S3 uploads can be slow
          stalledInterval: 120_000, // Check for stalled jobs every 2 minutes
        };
      }
      case QueueName.AssetThumbnailGeneration:
      case QueueName.PersonThumbnailGeneration: {
        return {
          lockDuration: 600_000, // 10 minutes - large videos (100-300MB+) need time for S3 download + FFmpeg processing + S3 upload
          stalledInterval: 300_000, // Check for stalled jobs every 5 minutes
        };
      }
      case QueueName.VideoConversion: {
        return {
          lockDuration: 300_000, // 5 minutes - video transcoding can take a long time
          stalledInterval: 180_000,
        };
      }
      case QueueName.MetadataExtraction: {
        return {
          lockDuration: 90_000, // 1.5 minutes
          stalledInterval: 60_000,
        };
      }
      default: {
        return {
          lockDuration: 60_000, // 1 minute default for other queues
          stalledInterval: 45_000,
        };
      }
    }
  }

  async run({ name, data }: JobItem) {
    const item = this.handlers[name as JobName];
    if (!item) {
      this.logger.warn(`Skipping unknown job: "${name}"`);
      return JobStatus.Skipped;
    }

    return item.handler(data);
  }

  setConcurrency(queueName: QueueName, concurrency: number) {
    const { machineId } = this.configRepository.getEnv();
    const actualQueueName = getActualQueueName(queueName, machineId);
    const worker = this.workers[actualQueueName];
    if (!worker) {
      this.logger.warn(`Unable to set queue concurrency, worker not found: '${actualQueueName}'`);
      return;
    }

    worker.concurrency = concurrency;
  }

  async isActive(name: QueueName): Promise<boolean> {
    const queue = this.getQueue(name);
    const count = await queue.getActiveCount();
    return count > 0;
  }

  async isPaused(name: QueueName): Promise<boolean> {
    return this.getQueue(name).isPaused();
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

  private getQueueName(name: JobName) {
    return (this.handlers[name] as JobMapItem).queueName;
  }

  async queueAll(items: JobItem[]): Promise<void> {
    if (items.length === 0) {
      return;
    }

    const { machineId: currentMachineId } = this.configRepository.getEnv();

    const promises = [];
    const itemsByQueue = {} as Record<string, (JobItem & { data: any; options: JobsOptions | undefined })[]>;
    for (const item of items) {
      const baseQueueName = this.getQueueName(item.name);

      // Use machineId from job data if present (chain propagation)
      // Otherwise use current machine's ID (initial job from HTTP)
      const machineId = getMachineIdFromJob(item.data, currentMachineId);

      // For affinity queues, inject machineId into job data if not already present
      let jobData = item.data || {};
      if (isAffinityQueue(baseQueueName) && !jobData.machineId) {
        jobData = { ...jobData, machineId };
      }

      const actualQueueName = getActualQueueName(baseQueueName, machineId);

      const job = {
        name: item.name,
        data: jobData,
        options: this.getJobOptions(item) || undefined,
      } as JobItem & { data: any; options: JobsOptions | undefined };

      if (job.options?.jobId) {
        // need to use add() instead of addBulk() for jobId deduplication
        promises.push(this.getDynamicQueue(actualQueueName).add(item.name, jobData, job.options));
      } else {
        itemsByQueue[actualQueueName] = itemsByQueue[actualQueueName] || [];
        itemsByQueue[actualQueueName].push(job);
      }
    }

    for (const [queueName, jobs] of Object.entries(itemsByQueue)) {
      const queue = this.getDynamicQueue(queueName);
      promises.push(queue.addBulk(jobs));
    }

    await Promise.all(promises);
  }

  async queue(item: JobItem): Promise<void> {
    return this.queueAll([item]);
  }

  async waitForQueueCompletion(...queues: QueueName[]): Promise<void> {
    const getPending = async () => {
      const results = await Promise.all(queues.map(async (name) => ({ pending: await this.isActive(name), name })));
      return results.filter(({ pending }) => pending).map(({ name }) => name);
    };

    let pending = await getPending();

    while (pending.length > 0) {
      this.logger.verbose(`Waiting for ${pending[0]} queue to stop...`);
      await setTimeout(1000);
      pending = await getPending();
    }
  }

  async searchJobs(name: QueueName, dto: QueueJobSearchDto): Promise<QueueJobResponseDto[]> {
    const jobs = await this.getQueue(name).getJobs(dto.status ?? Object.values(QueueJobStatus), 0, 1000);
    return jobs.map((job) => {
      const { id, name, timestamp, data } = job;
      return { id, name: name as JobName, timestamp, data };
    });
  }

  private getJobOptions(item: JobItem): JobsOptions | null {
    switch (item.name) {
      case JobName.NotifyAlbumUpdate: {
        return {
          jobId: `${item.data.id}/${item.data.recipientId}`,
          delay: item.data?.delay,
        };
      }
      case JobName.StorageTemplateMigrationSingle: {
        return { jobId: item.data.id };
      }
      case JobName.PersonGenerateThumbnail: {
        return { priority: 1 };
      }
      case JobName.FacialRecognitionQueueAll: {
        return { jobId: JobName.FacialRecognitionQueueAll };
      }
      default: {
        return null;
      }
    }
  }

  private getQueue(queue: QueueName): Queue {
    return this.moduleRef.get<Queue>(getQueueToken(queue), { strict: false });
  }

  /**
   * Get or create a queue instance for a given queue name.
   * Used for machine-prefixed queues that are created dynamically.
   */
  private getDynamicQueue(queueName: string): Queue {
    if (!this.dynamicQueueCache[queueName]) {
      const { bull } = this.configRepository.getEnv();
      this.dynamicQueueCache[queueName] = new Queue(queueName, bull.config);
    }
    return this.dynamicQueueCache[queueName];
  }

  /** @deprecated */
  // todo: remove this when asset notifications no longer need it.
  public async removeJob(name: JobName, jobID: string): Promise<void> {
    const existingJob = await this.getQueue(this.getQueueName(name)).getJob(jobID);
    if (existingJob) {
      await existingJob.remove();
    }
  }
}
