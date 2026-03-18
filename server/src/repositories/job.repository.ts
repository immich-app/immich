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
import { getActualQueueName, isAffinityQueue, isInitialRecoveryJob } from 'src/utils/queue.util';

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

      // For affinity queues, also listen to the global queue for recovery jobs
      // Recovery jobs are initially queued without machineId so any machine can pick them up
      if (isAffinityQueue(baseQueueName) && actualQueueName !== baseQueueName) {
        this.logger.log(`Starting global queue worker for recovery jobs: ${baseQueueName}`);
        this.workers[`${baseQueueName}-global`] = new Worker(
          baseQueueName,
          (job) => this.eventRepository.emit('JobRun', baseQueueName, job as JobItem),
          { ...bull.config, concurrency: 1, ...workerOptions },
        );
      }
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

    // Also set concurrency on the global queue worker for recovery jobs
    const globalWorker = this.workers[`${queueName}-global`];
    if (globalWorker) {
      globalWorker.concurrency = concurrency;
    }
  }

  async isActive(name: QueueName): Promise<boolean> {
    const queue = this.getQueueForStatus(name);
    const count = await queue.getActiveCount();
    return count > 0;
  }

  async isPaused(name: QueueName): Promise<boolean> {
    return this.getQueueForStatus(name).isPaused();
  }

  pause(name: QueueName) {
    return this.getQueueForStatus(name).pause();
  }

  resume(name: QueueName) {
    return this.getQueueForStatus(name).resume();
  }

  empty(name: QueueName) {
    return this.getQueueForStatus(name).drain();
  }

  clear(name: QueueName, type: QueueCleanType) {
    return this.getQueueForStatus(name).clean(0, 1000, type);
  }

  async getJobCounts(name: QueueName): Promise<JobCounts> {
    if (!isAffinityQueue(name)) {
      return this.getQueue(name).getJobCounts(
        'active', 'completed', 'failed', 'delayed', 'waiting', 'paused',
      ) as unknown as Promise<JobCounts>;
    }

    // Affinity queues: aggregate counts across base + all machine-prefixed variants
    const variants = await this.discoverQueueVariants(name);
    const totals: JobCounts = { active: 0, completed: 0, failed: 0, delayed: 0, waiting: 0, paused: 0 };

    for (const variant of variants) {
      const queue = this.getDynamicQueue(variant);
      const counts = await queue.getJobCounts(
        'active', 'completed', 'failed', 'delayed', 'waiting', 'paused',
      ) as unknown as JobCounts;
      totals.active += counts.active || 0;
      totals.completed += counts.completed || 0;
      totals.failed += counts.failed || 0;
      totals.delayed += counts.delayed || 0;
      totals.waiting += counts.waiting || 0;
      totals.paused += counts.paused || 0;
    }

    return totals;
  }

  private getQueueName(name: JobName) {
    return (this.handlers[name] as JobMapItem).queueName;
  }

  async queueAll(items: JobItem[]): Promise<void> {
    if (items.length === 0) {
      return;
    }

    const promises = [];
    const itemsByQueue = {} as Record<string, (JobItem & { data: any; options: JobsOptions | undefined })[]>;
    for (const item of items) {
      const baseQueueName = this.getQueueName(item.name);

      // Only use machine affinity when machineId is explicitly set in job data
      // (meaning a previous pipeline step injected it via onDone).
      // Admin/standalone jobs have no machineId -> base queue -> distributed across all workers.
      // Initial recovery jobs also go to base queue so any machine can pick them up.
      const hasExplicitMachineId = !!item.data?.machineId;
      const isInitialRecovery = isInitialRecoveryJob(item.data);
      const useAffinity = isAffinityQueue(baseQueueName) && hasExplicitMachineId && !isInitialRecovery;

      const machineId = useAffinity ? item.data!.machineId! : '';
      const jobData = item.data || {};
      const actualQueueName = useAffinity ? getActualQueueName(baseQueueName, machineId) : baseQueueName;

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
    const jobs = await this.getQueueForStatus(name).getJobs(dto.status ?? Object.values(QueueJobStatus), 0, 1000);
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
   * Discover all queue variants (base + machine-prefixed) for an affinity queue.
   * Scans Redis for `immich_bull:{baseName}-*:meta` keys.
   * Results are cached for 60 seconds.
   */
  private variantCache: Record<string, { variants: string[]; timestamp: number }> = {};
  private async discoverQueueVariants(baseName: QueueName): Promise<string[]> {
    const cached = this.variantCache[baseName];
    if (cached && Date.now() - cached.timestamp < 60_000) {
      return cached.variants;
    }

    const variants: string[] = [baseName];
    try {
      const queue = this.getQueue(baseName);
      const client = await queue.client;

      let cursor = '0';
      do {
        const [nextCursor, keys] = await client.scan(
          cursor, 'MATCH', `immich_bull:${baseName}-*:meta`, 'COUNT', 100,
        );
        cursor = nextCursor;
        for (const key of keys) {
          const match = key.match(/immich_bull:([^:]+):meta/);
          if (match && match[1] !== baseName) {
            variants.push(match[1]);
          }
        }
      } while (cursor !== '0');
    } catch (error) {
      this.logger.error(`Failed to discover queue variants for ${baseName}: ${error}`);
    }

    this.variantCache[baseName] = { variants, timestamp: Date.now() };
    return variants;
  }

  /**
   * Get the queue for status operations (isActive, isPaused, pause, resume, empty, clear).
   * Always returns the base queue -- getJobCounts() already aggregates across all variants.
   */
  private getQueueForStatus(name: QueueName): Queue {
    return this.getQueue(name);
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
