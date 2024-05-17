import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { snakeCase } from 'lodash';
import { SystemConfigCore } from 'src/cores/system-config.core';
import { mapAsset } from 'src/dtos/asset-response.dto';
import { AllJobStatusResponseDto, JobCommandDto, JobStatusDto } from 'src/dtos/job.dto';
import { AssetType } from 'src/entities/asset.entity';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { ClientEvent, IEventRepository } from 'src/interfaces/event.interface';
import {
  ConcurrentQueueName,
  IJobRepository,
  JobCommand,
  JobHandler,
  JobItem,
  JobName,
  JobStatus,
  QueueCleanType,
  QueueName,
} from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IMetricRepository } from 'src/interfaces/metric.interface';
import { IPersonRepository } from 'src/interfaces/person.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';

@Injectable()
export class JobService {
  private configCore: SystemConfigCore;

  constructor(
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IEventRepository) private eventRepository: IEventRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ISystemMetadataRepository) systemMetadataRepository: ISystemMetadataRepository,
    @Inject(IPersonRepository) private personRepository: IPersonRepository,
    @Inject(IMetricRepository) private metricRepository: IMetricRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(JobService.name);
    this.configCore = SystemConfigCore.create(systemMetadataRepository, logger);
  }

  async handleCommand(queueName: QueueName, dto: JobCommandDto): Promise<JobStatusDto> {
    this.logger.debug(`Handling command: queue=${queueName},force=${dto.force}`);

    switch (dto.command) {
      case JobCommand.START: {
        await this.start(queueName, dto);
        break;
      }

      case JobCommand.PAUSE: {
        await this.jobRepository.pause(queueName);
        break;
      }

      case JobCommand.RESUME: {
        await this.jobRepository.resume(queueName);
        break;
      }

      case JobCommand.EMPTY: {
        await this.jobRepository.empty(queueName);
        break;
      }

      case JobCommand.CLEAR_FAILED: {
        const failedJobs = await this.jobRepository.clear(queueName, QueueCleanType.FAILED);
        this.logger.debug(`Cleared failed jobs: ${failedJobs}`);
        break;
      }
    }

    return this.getJobStatus(queueName);
  }

  async getJobStatus(queueName: QueueName): Promise<JobStatusDto> {
    const [jobCounts, queueStatus] = await Promise.all([
      this.jobRepository.getJobCounts(queueName),
      this.jobRepository.getQueueStatus(queueName),
    ]);

    return { jobCounts, queueStatus };
  }

  async getAllJobsStatus(): Promise<AllJobStatusResponseDto> {
    const response = new AllJobStatusResponseDto();
    for (const queueName of Object.values(QueueName)) {
      response[queueName] = await this.getJobStatus(queueName);
    }
    return response;
  }

  private async start(name: QueueName, { force }: JobCommandDto): Promise<void> {
    const { isActive } = await this.jobRepository.getQueueStatus(name);
    if (isActive) {
      throw new BadRequestException(`Job is already running`);
    }

    this.metricRepository.jobs.addToCounter(`immich.queues.${snakeCase(name)}.started`, 1);

    switch (name) {
      case QueueName.VIDEO_CONVERSION: {
        return this.jobRepository.queue({ name: JobName.QUEUE_VIDEO_CONVERSION, data: { force } });
      }

      case QueueName.STORAGE_TEMPLATE_MIGRATION: {
        return this.jobRepository.queue({ name: JobName.STORAGE_TEMPLATE_MIGRATION });
      }

      case QueueName.MIGRATION: {
        return this.jobRepository.queue({ name: JobName.QUEUE_MIGRATION });
      }

      case QueueName.SMART_SEARCH: {
        return this.jobRepository.queue({ name: JobName.QUEUE_SMART_SEARCH, data: { force } });
      }

      case QueueName.DUPLICATE_DETECTION: {
        return this.jobRepository.queue({ name: JobName.QUEUE_DUPLICATE_DETECTION, data: { force } });
      }

      case QueueName.METADATA_EXTRACTION: {
        return this.jobRepository.queue({ name: JobName.QUEUE_METADATA_EXTRACTION, data: { force } });
      }

      case QueueName.SIDECAR: {
        return this.jobRepository.queue({ name: JobName.QUEUE_SIDECAR, data: { force } });
      }

      case QueueName.THUMBNAIL_GENERATION: {
        return this.jobRepository.queue({ name: JobName.QUEUE_GENERATE_THUMBNAILS, data: { force } });
      }

      case QueueName.FACE_DETECTION: {
        return this.jobRepository.queue({ name: JobName.QUEUE_FACE_DETECTION, data: { force } });
      }

      case QueueName.FACIAL_RECOGNITION: {
        return this.jobRepository.queue({ name: JobName.QUEUE_FACIAL_RECOGNITION, data: { force } });
      }

      case QueueName.LIBRARY: {
        return this.jobRepository.queue({ name: JobName.LIBRARY_QUEUE_SCAN_ALL, data: { force } });
      }

      default: {
        throw new BadRequestException(`Invalid job name: ${name}`);
      }
    }
  }

  async init(jobHandlers: Record<JobName, JobHandler>) {
    const config = await this.configCore.getConfig();
    for (const queueName of Object.values(QueueName)) {
      let concurrency = 1;

      if (this.isConcurrentQueue(queueName)) {
        concurrency = config.job[queueName].concurrency;
      }

      this.logger.debug(`Registering ${queueName} with a concurrency of ${concurrency}`);
      this.jobRepository.addHandler(queueName, concurrency, async (item: JobItem): Promise<void> => {
        const { name, data } = item;

        const queueMetric = `immich.queues.${snakeCase(queueName)}.active`;
        this.metricRepository.jobs.addToGauge(queueMetric, 1);

        try {
          const handler = jobHandlers[name];
          const status = await handler(data);
          const jobMetric = `immich.jobs.${name.replaceAll('-', '_')}.${status}`;
          this.metricRepository.jobs.addToCounter(jobMetric, 1);
          if (status === JobStatus.SUCCESS || status == JobStatus.SKIPPED) {
            await this.onDone(item);
          }
        } catch (error: Error | any) {
          this.logger.error(`Unable to run job handler (${queueName}/${name}): ${error}`, error?.stack, data);
        } finally {
          this.metricRepository.jobs.addToGauge(queueMetric, -1);
        }
      });
    }

    this.configCore.config$.subscribe((config) => {
      this.logger.debug(`Updating queue concurrency settings`);
      for (const queueName of Object.values(QueueName)) {
        let concurrency = 1;
        if (this.isConcurrentQueue(queueName)) {
          concurrency = config.job[queueName].concurrency;
        }
        this.logger.debug(`Setting ${queueName} concurrency to ${concurrency}`);
        this.jobRepository.setConcurrency(queueName, concurrency);
      }
    });
  }

  private isConcurrentQueue(name: QueueName): name is ConcurrentQueueName {
    return ![
      QueueName.FACIAL_RECOGNITION,
      QueueName.STORAGE_TEMPLATE_MIGRATION,
      QueueName.DUPLICATE_DETECTION,
    ].includes(name);
  }

  async handleNightlyJobs() {
    await this.jobRepository.queueAll([
      { name: JobName.ASSET_DELETION_CHECK },
      { name: JobName.USER_DELETE_CHECK },
      { name: JobName.PERSON_CLEANUP },
      { name: JobName.QUEUE_GENERATE_THUMBNAILS, data: { force: false } },
      { name: JobName.CLEAN_OLD_AUDIT_LOGS },
      { name: JobName.USER_SYNC_USAGE },
      { name: JobName.QUEUE_FACIAL_RECOGNITION, data: { force: false } },
      { name: JobName.CLEAN_OLD_SESSION_TOKENS },
    ]);
  }

  /**
   * Queue follow up jobs
   */
  private async onDone(item: JobItem) {
    switch (item.name) {
      case JobName.SIDECAR_SYNC:
      case JobName.SIDECAR_DISCOVERY: {
        await this.jobRepository.queue({ name: JobName.METADATA_EXTRACTION, data: item.data });
        break;
      }

      case JobName.SIDECAR_WRITE: {
        await this.jobRepository.queue({
          name: JobName.METADATA_EXTRACTION,
          data: { id: item.data.id, source: 'sidecar-write' },
        });
      }

      case JobName.METADATA_EXTRACTION: {
        if (item.data.source === 'sidecar-write') {
          const [asset] = await this.assetRepository.getByIdsWithAllRelations([item.data.id]);
          if (asset) {
            this.eventRepository.clientSend(ClientEvent.ASSET_UPDATE, asset.ownerId, mapAsset(asset));
          }
        }
        await this.jobRepository.queue({ name: JobName.LINK_LIVE_PHOTOS, data: item.data });
        break;
      }

      case JobName.LINK_LIVE_PHOTOS: {
        await this.jobRepository.queue({ name: JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE, data: item.data });
        break;
      }

      case JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE: {
        if (item.data.source === 'upload') {
          await this.jobRepository.queue({ name: JobName.GENERATE_PREVIEW, data: item.data });
        }
        break;
      }

      case JobName.GENERATE_PERSON_THUMBNAIL: {
        const { id } = item.data;
        const person = await this.personRepository.getById(id);
        if (person) {
          this.eventRepository.clientSend(ClientEvent.PERSON_THUMBNAIL, person.ownerId, person.id);
        }
        break;
      }

      case JobName.GENERATE_PREVIEW: {
        const jobs: JobItem[] = [
          { name: JobName.GENERATE_THUMBNAIL, data: item.data },
          { name: JobName.GENERATE_THUMBHASH, data: item.data },
        ];

        if (item.data.source === 'upload') {
          jobs.push({ name: JobName.SMART_SEARCH, data: item.data }, { name: JobName.FACE_DETECTION, data: item.data });

          const [asset] = await this.assetRepository.getByIds([item.data.id]);
          if (asset) {
            if (asset.type === AssetType.VIDEO) {
              jobs.push({ name: JobName.VIDEO_CONVERSION, data: item.data });
            } else if (asset.livePhotoVideoId) {
              jobs.push({ name: JobName.VIDEO_CONVERSION, data: { id: asset.livePhotoVideoId } });
            }
          }
        }

        await this.jobRepository.queueAll(jobs);
        break;
      }

      case JobName.GENERATE_THUMBNAIL: {
        if (item.data.source !== 'upload') {
          break;
        }

        const [asset] = await this.assetRepository.getByIdsWithAllRelations([item.data.id]);

        // Only live-photo motion part will be marked as not visible immediately on upload. Skip notifying clients
        if (asset && asset.isVisible) {
          this.eventRepository.clientSend(ClientEvent.UPLOAD_SUCCESS, asset.ownerId, mapAsset(asset));
        }
        break;
      }

      case JobName.SMART_SEARCH: {
        if (item.data.source === 'upload') {
          await this.jobRepository.queue({ name: JobName.DUPLICATE_DETECTION, data: item.data });
        }
        break;
      }

      case JobName.USER_DELETION: {
        this.eventRepository.clientBroadcast(ClientEvent.USER_DELETE, item.data.id);
        break;
      }
    }
  }
}
