import { snakeCase } from 'lodash-es';
import { OnEvent } from 'src/decorators.js';
import { ImmichWorker, JobStatus } from 'src/enum.js';
import type { ArgOf, ArgsOf } from 'src/repositories/event.repository.js';
import { BaseService } from 'src/services/base.service.js';

export class TelemetryService extends BaseService {
  @OnEvent({ name: 'AppBootstrap', workers: [ImmichWorker.Api] })
  async onBootstrap(): Promise<void> {
    const userCount = await this.userRepository.getCount();
    this.telemetryRepository.api.addToGauge('immich.users.total', userCount);
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

  @OnEvent({ name: 'JobStart' })
  onJobStart(...[queueName]: ArgsOf<'JobStart'>) {
    const queueMetric = `immich.queues.${snakeCase(queueName)}.active`;
    this.telemetryRepository.jobs.addToGauge(queueMetric, 1);
  }

  @OnEvent({ name: 'JobSuccess' })
  onJobSuccess({ job, response }: ArgOf<'JobSuccess'>) {
    if (!(response && Object.values(JobStatus).includes(response as JobStatus))) {
      return;
    }

    const jobMetric = `immich.jobs.${snakeCase(job.name)}.${response}`;
    this.telemetryRepository.jobs.addToCounter(jobMetric, 1);
  }

  @OnEvent({ name: 'JobError' })
  onJobError({ job }: ArgOf<'JobError'>) {
    const jobMetric = `immich.jobs.${snakeCase(job.name)}.${JobStatus.Failed}`;
    this.telemetryRepository.jobs.addToCounter(jobMetric, 1);
  }

  @OnEvent({ name: 'JobComplete' })
  onJobComplete(...[queueName]: ArgsOf<'JobComplete'>) {
    const queueMetric = `immich.queues.${snakeCase(queueName)}.active`;
    this.telemetryRepository.jobs.addToGauge(queueMetric, -1);
  }

  @OnEvent({ name: 'QueueStart' })
  onQueueStart({ name }: ArgOf<'QueueStart'>) {
    this.telemetryRepository.jobs.addToCounter(`immich.queues.${snakeCase(name)}.started`, 1);
  }
}
