import { snakeCase } from 'lodash';
import { OnEvent } from 'src/decorators';
import { ImmichTelemetry, ImmichWorker, JobStatus, QueueName } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';

const QUEUE_METRICS_POLLING_INTERVAL = 5000;

export class TelemetryService extends BaseService {
  private queueWaitingCounts = new Map<string, number>();
  private queuePausedCounts = new Map<string, number>();
  private queueDelayedCounts = new Map<string, number>();
  private queueActiveCounts = new Map<string, number>();
  private pollingInterval?: NodeJS.Timeout;

  @OnEvent({ name: 'AppBootstrap', workers: [ImmichWorker.Api] })
  async onBootstrap(): Promise<void> {
    const userCount = await this.userRepository.getCount();
    this.telemetryRepository.api.addToGauge('immich.users.total', userCount);

    const { telemetry } = this.configRepository.getEnv();
    if (telemetry.metrics.has(ImmichTelemetry.Job)) {
      // Register observable gauges for queued metrics
      this.registerQueuedMetrics();

      // Start polling queue statistics
      await this.updateQueuedMetrics();
      this.pollingInterval = setInterval(() => {
        void this.updateQueuedMetrics();
      }, QUEUE_METRICS_POLLING_INTERVAL);
    }
  }

  @OnEvent({ name: 'AppShutdown' })
  onShutdown(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  private registerQueuedMetrics(): void {
    for (const queueName of Object.values(QueueName)) {
      const queueKey = snakeCase(queueName);

      this.telemetryRepository.jobs.setObservableGauge(
        `immich.queues.${queueKey}.waiting`,
        () => this.queueWaitingCounts.get(queueKey) ?? 0,
        { description: `Number of waiting jobs in ${queueName} queue` },
      );

      this.telemetryRepository.jobs.setObservableGauge(
        `immich.queues.${queueKey}.paused`,
        () => this.queuePausedCounts.get(queueKey) ?? 0,
        { description: `Number of paused jobs in ${queueName} queue` },
      );

      this.telemetryRepository.jobs.setObservableGauge(
        `immich.queues.${queueKey}.delayed`,
        () => this.queueDelayedCounts.get(queueKey) ?? 0,
        { description: `Number of delayed jobs in ${queueName} queue` },
      );

      this.telemetryRepository.jobs.setObservableGauge(
        `immich.queues.${queueKey}.active`,
        () => this.queueActiveCounts.get(queueKey) ?? 0,
        { description: `Number of active jobs in ${queueName} queue` },
      );
    }
  }

  private async updateQueuedMetrics(): Promise<void> {
    await Promise.all(
      Object.values(QueueName).map(async (queueName) => {
        try {
          const stats = await this.jobRepository.getJobCounts(queueName);
          const queueKey = snakeCase(queueName);
          this.queueWaitingCounts.set(queueKey, stats.waiting);
          this.queuePausedCounts.set(queueKey, stats.paused);
          this.queueDelayedCounts.set(queueKey, stats.delayed);
          this.queueActiveCounts.set(queueKey, stats.active);
        } catch (error) {
          this.logger.debug(`Failed to update queued metrics for ${queueName}: ${error}`);
        }
      }),
    );
  }

  @OnEvent({ name: 'UserCreate' })
  onUserCreate() {
    this.telemetryRepository.api.addToGauge(`immich.users.total`, 1);
  }

  @OnEvent({ name: 'UserTrash' })
  onUserTrash() {
    this.telemetryRepository.api.addToGauge(`immich.users.total`, -1);
  }

  @OnEvent({ name: 'UserRestore' })
  onUserRestore() {
    this.telemetryRepository.api.addToGauge(`immich.users.total`, 1);
  }

  @OnEvent({ name: 'JobSuccess' })
  onJobSuccess({ job, response }: ArgOf<'JobSuccess'>) {
    if (response && Object.values(JobStatus).includes(response as JobStatus)) {
      const jobMetric = `immich.jobs.${snakeCase(job.name)}.${response}`;
      this.telemetryRepository.jobs.addToCounter(jobMetric, 1);
    }
  }

  @OnEvent({ name: 'JobError' })
  onJobError({ job }: ArgOf<'JobError'>) {
    const jobMetric = `immich.jobs.${snakeCase(job.name)}.${JobStatus.Failed}`;
    this.telemetryRepository.jobs.addToCounter(jobMetric, 1);
  }

  @OnEvent({ name: 'QueueStart' })
  onQueueStart({ name }: ArgOf<'QueueStart'>) {
    this.telemetryRepository.jobs.addToCounter(`immich.queues.${snakeCase(name)}.started`, 1);
  }
}
